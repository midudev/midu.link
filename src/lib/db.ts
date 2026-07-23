import { createClient, type Client } from '@libsql/client/web';

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

/**
 * Resolve a secret from the runtime (Vercel/Node) or from Vite's env (local `astro dev`).
 * Dynamic `process.env[name]` stays runtime-evaluated so Vercel can inject secrets
 * after the build; `import.meta.env` covers local development.
 */
function env(name: 'TURSO_DATABASE_URL' | 'TURSO_AUTH_TOKEN'): string | undefined {
	const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
	if (fromProcess) return fromProcess;

	// Fall back to Vite-injected env (local dev). Access is explicit so the
	// keys stay known to Astro/Vite's env loading.
	if (name === 'TURSO_DATABASE_URL') return import.meta.env.TURSO_DATABASE_URL;
	if (name === 'TURSO_AUTH_TOKEN') return import.meta.env.TURSO_AUTH_TOKEN;
	return undefined;
}

function getClient(): Client | null {
	const url = env('TURSO_DATABASE_URL');
	const authToken = env('TURSO_AUTH_TOKEN');

	if (!url || !authToken) {
		console.warn('[analytics] Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
		return null;
	}

	if (!client) {
		client = createClient({ url, authToken });
	}

	return client;
}

/** Ensure the clicks_daily table exists (idempotent). */
export async function ensureSchema(): Promise<void> {
	const db = getClient();
	if (!db) return;

	if (!schemaReady) {
		schemaReady = db
			.execute(`
				CREATE TABLE IF NOT EXISTS clicks_daily (
					slug TEXT NOT NULL,
					day  TEXT NOT NULL,
					count INTEGER NOT NULL DEFAULT 0,
					PRIMARY KEY (slug, day)
				)
			`)
			.then(() => undefined)
			.catch((err) => {
				schemaReady = null;
				throw err;
			});
	}

	await schemaReady;
}

/** UTC calendar day as YYYY-MM-DD. */
export function utcDay(date = new Date()): string {
	return date.toISOString().slice(0, 10);
}

/**
 * Increment today's click counter for a slug.
 * Safe to call in waitUntil — never throws to the caller if wrapped.
 */
export async function recordClick(slug: string): Promise<void> {
	const db = getClient();
	if (!db) return;

	await ensureSchema();

	const day = utcDay();
	await db.execute({
		sql: `
			INSERT INTO clicks_daily (slug, day, count)
			VALUES (?, ?, 1)
			ON CONFLICT(slug, day) DO UPDATE SET count = count + 1
		`,
		args: [slug, day],
	});
}

export type DayCount = { day: string; count: number };

export type SlugStats = {
	/** Last 7 UTC days, oldest → newest (always length 7). */
	days: DayCount[];
	/** Clicks today (UTC). */
	today: number;
	/** Sum of the last 7 UTC days. */
	week: number;
};

/** Last N UTC day keys, oldest first. */
export function lastNDays(n: number, from = new Date()): string[] {
	const days: string[] = [];
	for (let i = n - 1; i >= 0; i--) {
		const d = new Date(from);
		d.setUTCDate(d.getUTCDate() - i);
		days.push(utcDay(d));
	}
	return days;
}

/**
 * Fetch last-7-day stats for every slug that has data (or for the given list).
 */
export async function getStats(slugs?: string[]): Promise<Record<string, SlugStats>> {
	const db = getClient();
	const window = lastNDays(7);
	const empty = (): SlugStats => ({
		days: window.map((day) => ({ day, count: 0 })),
		today: 0,
		week: 0,
	});

	if (!db) {
		const out: Record<string, SlugStats> = {};
		for (const s of slugs ?? []) out[s] = empty();
		return out;
	}

	await ensureSchema();

	const from = window[0]!;
	const result = await db.execute({
		sql: `
			SELECT slug, day, count
			FROM clicks_daily
			WHERE day >= ?
			ORDER BY day ASC
		`,
		args: [from],
	});

	const bySlug = new Map<string, Map<string, number>>();

	for (const row of result.rows) {
		const slug = String(row.slug);
		const day = String(row.day);
		const count = Number(row.count) || 0;
		if (!bySlug.has(slug)) bySlug.set(slug, new Map());
		bySlug.get(slug)!.set(day, count);
	}

	const targets = slugs ?? [...bySlug.keys()];
	const out: Record<string, SlugStats> = {};
	const today = window[window.length - 1]!;

	for (const slug of targets) {
		const map = bySlug.get(slug);
		const days = window.map((day) => ({
			day,
			count: map?.get(day) ?? 0,
		}));
		const week = days.reduce((sum, d) => sum + d.count, 0);
		out[slug] = {
			days,
			today: map?.get(today) ?? 0,
			week,
		};
	}

	return out;
}

export type SlugAnalytics = {
	/** Daily series oldest → newest (filled zeros for missing days in range). */
	days: DayCount[];
	today: number;
	week: number;
	month: number;
	/** All-time total clicks recorded for this slug. */
	total: number;
	/** First day with any clicks, if any. */
	firstDay: string | null;
	/** Day with the highest click count. */
	peak: DayCount | null;
};

/**
 * Full analytics for a single slug: daily history (up to `maxDays`) + rollups.
 */
export async function getSlugAnalytics(slug: string, maxDays = 90): Promise<SlugAnalytics> {
	const empty: SlugAnalytics = {
		days: lastNDays(Math.min(maxDays, 7)).map((day) => ({ day, count: 0 })),
		today: 0,
		week: 0,
		month: 0,
		total: 0,
		firstDay: null,
		peak: null,
	};

	const db = getClient();
	if (!db) return empty;

	await ensureSchema();

	const result = await db.execute({
		sql: `
			SELECT day, count
			FROM clicks_daily
			WHERE slug = ?
			ORDER BY day ASC
		`,
		args: [slug],
	});

	if (result.rows.length === 0) {
		// Still return a 7-day zero window so the chart has structure.
		return {
			...empty,
			days: lastNDays(7).map((day) => ({ day, count: 0 })),
		};
	}

	const map = new Map<string, number>();
	let total = 0;
	let firstDay: string | null = null;
	let peak: DayCount | null = null;

	for (const row of result.rows) {
		const day = String(row.day);
		const count = Number(row.count) || 0;
		map.set(day, count);
		total += count;
		if (!firstDay) firstDay = day;
		if (!peak || count > peak.count) peak = { day, count };
	}

	const todayKey = utcDay();
	const weekKeys = lastNDays(7);
	const monthKeys = lastNDays(30);

	// Chart window: from first recorded day (capped at maxDays) through today.
	const spanStart = firstDay!;
	const startCandidate = lastNDays(maxDays)[0]!;
	const chartFrom = spanStart > startCandidate ? spanStart : startCandidate;

	const days: DayCount[] = [];
	{
		const cursor = new Date(`${chartFrom}T00:00:00.000Z`);
		const end = new Date(`${todayKey}T00:00:00.000Z`);
		while (cursor <= end) {
			const day = utcDay(cursor);
			days.push({ day, count: map.get(day) ?? 0 });
			cursor.setUTCDate(cursor.getUTCDate() + 1);
		}
	}

	const sumKeys = (keys: string[]) => keys.reduce((s, d) => s + (map.get(d) ?? 0), 0);

	return {
		days,
		today: map.get(todayKey) ?? 0,
		week: sumKeys(weekKeys),
		month: sumKeys(monthKeys),
		total,
		firstDay,
		peak,
	};
}

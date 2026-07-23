/**
 * One-shot schema bootstrap for Turso.
 * Usage: node --env-file=.env scripts/init-db.mjs
 */
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
	console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
	process.exit(1);
}

const db = createClient({ url, authToken });

await db.execute(`
	CREATE TABLE IF NOT EXISTS clicks_daily (
		slug TEXT NOT NULL,
		day  TEXT NOT NULL,
		count INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (slug, day)
	)
`);

console.log('✓ clicks_daily ready');

import type { APIRoute } from 'astro';
import { recordClick } from '../../lib/db';
import { trackableBySlug } from '../../lib/links';

export const prerender = false;

/**
 * Click collector for the special landings (`navigator.sendBeacon`). Short
 * links are counted directly in `src/worker.ts`, without this endpoint.
 */
export const POST: APIRoute = async ({ request, locals }) => {
	let slug: unknown;

	try {
		({ slug } = (await request.json()) as { slug?: unknown });
	} catch {
		return new Response(null, { status: 400 });
	}

	if (typeof slug !== 'string' || !trackableBySlug.has(slug)) {
		return new Response(null, { status: 404 });
	}

	// The beacon never reads the answer: reply now, write after.
	locals.cfContext.waitUntil(
		recordClick(slug).catch((err) => console.error('[analytics] track failed', slug, err)),
	);

	return new Response(null, { status: 202 });
};

import type { APIRoute } from 'astro';
import { linksBySlug } from '../../lib/links';
import { recordClick } from '../../lib/db';

export const prerender = false;

/**
 * Internal click collector. Invoked in the background from middleware via
 * waitUntil(fetch) so the 302 never waits on Turso.
 */
export const POST: APIRoute = async ({ request }) => {
	let slug: string | undefined;

	try {
		const body = (await request.json()) as { slug?: unknown };
		if (typeof body.slug === 'string') slug = body.slug;
	} catch {
		return new Response(null, { status: 400 });
	}

	if (!slug || !linksBySlug.has(slug)) {
		return new Response(null, { status: 404 });
	}

	try {
		await recordClick(slug);
	} catch (err) {
		console.error('[analytics] track failed', slug, err);
		return new Response(null, { status: 500 });
	}

	return new Response(null, { status: 204 });
};

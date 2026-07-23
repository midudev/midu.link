import type { APIRoute } from 'astro';
import { waitUntil } from '@vercel/functions';
import { linksBySlug } from '../lib/links';

export const prerender = false;

/**
 * Short-link handler. Must be an on-demand route (not static redirects) so
 * Vercel doesn't force status 404 on the response — that was breaking all
 * redirects after the analytics change.
 */
export const GET: APIRoute = async ({ params, url }) => {
	const slug = params.slug;
	if (!slug) {
		return new Response('Not found', { status: 404 });
	}

	const destination = linksBySlug.get(slug);
	if (!destination) {
		return new Response('Not found', { status: 404 });
	}

	// Fire-and-forget analytics — never delay the 302.
	const track = fetch(new URL('/api/track', url), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ slug }),
		keepalive: true,
	}).catch((err) => {
		console.error('[analytics] track fetch failed', slug, err);
	});

	try {
		waitUntil(track);
	} catch {
		void track;
	}

	return Response.redirect(destination, 302);
};

import { defineMiddleware } from 'astro:middleware';
import { waitUntil } from '@vercel/functions';
import { linksBySlug } from './lib/links';

/** Paths / prefixes that must never be treated as short links. */
const PASSTHROUGH = new Set([
	'',
	'api',
	'favicon.svg',
	'robots.txt',
	'sitemap.xml',
	'og.png',
	'_astro',
	'fonts',
]);

function shouldPassthrough(pathname: string): boolean {
	const segment = pathname.replace(/^\//, '').split('/')[0] ?? '';
	if (PASSTHROUGH.has(segment)) return true;
	// Any path with a file extension (assets)
	if (segment.includes('.')) return true;
	return false;
}

/**
 * Resolve short links with a 302. Click tracking is fire-and-forget:
 * a background fetch to /api/track (kept alive with waitUntil on Vercel)
 * so Turso latency never touches the redirect path.
 */
export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;

	// Only single-segment short links: /slug
	if (pathname === '/' || pathname.split('/').filter(Boolean).length !== 1) {
		return next();
	}

	if (shouldPassthrough(pathname)) {
		return next();
	}

	const slug = pathname.slice(1);
	const destination = linksBySlug.get(slug);

	if (!destination) {
		return next();
	}

	// Background track — never await before responding.
	const trackUrl = new URL('/api/track', context.url);
	const track = fetch(trackUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ slug }),
		// keepalive helps browsers; on the server it is a no-op / best-effort.
		keepalive: true,
	}).catch((err) => {
		console.error('[analytics] track fetch failed', slug, err);
	});

	try {
		waitUntil(track);
	} catch {
		// Local dev / non-Vercel: still kick off the request without blocking.
		void track;
	}

	return Response.redirect(destination, 302);
});

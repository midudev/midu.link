import type { APIRoute } from 'astro';
import { recordClick } from '../../lib/db';
import { specialLandingSlugs } from '../../lib/links';

export const prerender = false;

/** `{"slug":"…"}` from a landing is a few dozen bytes. */
const MAX_BODY_BYTES = 256;

/**
 * Click collector for the special landings (`navigator.sendBeacon`). Short
 * links are counted directly in `src/worker.ts`, so only landing slugs are
 * accepted here: anything else would let a request inflate any link's count.
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
	// Browsers always send Origin on POST: reject beacons fired from other sites.
	const origin = request.headers.get('origin');
	const fetchSite = request.headers.get('sec-fetch-site');
	if ((origin && origin !== url.origin) || (fetchSite && fetchSite !== 'same-origin')) {
		return new Response(null, { status: 403 });
	}

	const length = Number(request.headers.get('content-length'));
	if (!length) return new Response(null, { status: 411 });
	if (length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

	let slug: unknown;
	try {
		({ slug } = (await request.json()) as { slug?: unknown });
	} catch {
		return new Response(null, { status: 400 });
	}

	if (typeof slug !== 'string' || !specialLandingSlugs.has(slug)) {
		return new Response(null, { status: 404 });
	}

	// The beacon never reads the answer: reply now, write after.
	locals.cfContext.waitUntil(
		recordClick(slug).catch((err) => console.error('[analytics] track failed', slug, err)),
	);

	return new Response(null, { status: 202 });
};

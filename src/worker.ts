import { handle } from '@astrojs/cloudflare/handler';
import { recordClick } from './lib/db';
import { linksBySlug } from './lib/links';

/** On-demand routes whose responses may be shared from the colo cache. */
const EDGE_CACHED = /^\/(?:api\/stats|stats\/[^/]+)\/?$/;

/**
 * Worker entrypoint. Static files never get here (the assets layer answers
 * them for free), so this only sees short links and on-demand routes.
 */
export default {
	async fetch(request, env, ctx) {
		const { method } = request;
		const { pathname, origin } = new URL(request.url);

		if (method === 'GET' || method === 'HEAD') {
			// Hot path: answer the 302 without booting Astro's router and count
			// the click after the response is sent.
			const slug = pathname.slice(1).replace(/\/$/, '');
			const destination = linksBySlug.get(slug);
			if (destination) {
				if (method === 'GET') {
					ctx.waitUntil(
						recordClick(slug).catch((err) => console.error('[analytics] track failed', slug, err)),
					);
				}
				return Response.redirect(destination, 302);
			}

			// Stats hit Turso: share one response per colo for its max-age.
			// The key drops the query string so `?x=` can't bypass the cache.
			if (method === 'GET' && EDGE_CACHED.test(pathname)) {
				const cache = await caches.open('ssr');
				const key = new Request(origin + pathname);
				const hit = await cache.match(key);
				if (hit) return hit;

				const response = await handle(request, env, ctx);
				if (response.status === 200 && /\bmax-age=\d/.test(response.headers.get('Cache-Control') ?? '')) {
					ctx.waitUntil(cache.put(key, response.clone()));
				}
				return response;
			}
		}

		return handle(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;

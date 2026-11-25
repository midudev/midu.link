import { handle } from '@astrojs/cloudflare/handler';
import { recordClick } from './lib/db';
import { linksBySlug } from './lib/links';

/** On-demand routes whose responses may be shared from the colo cache. */
const EDGE_CACHED = /^\/(?:api\/stats|stats\/[^/]+)\/?$/;

/** slug → destination, normalized once per isolate as Response.redirect would. */
const redirects = new Map([...linksBySlug].map(([slug, url]) => [slug, new URL(url).href]));

/** HTTPS only for a year; no includeSubDomains, so other hosts stay unaffected. */
const HSTS = 'max-age=31536000';

/** The `/*` rule of public/_headers, which only reaches static assets. */
const SECURITY_HEADERS: [string, string][] = [
	['Strict-Transport-Security', HSTS],
	['Content-Security-Policy', "frame-ancestors 'none'"],
	['X-Frame-Options', 'DENY'],
	['X-Content-Type-Options', 'nosniff'],
	['Referrer-Policy', 'strict-origin-when-cross-origin'],
	['Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'],
];

/** Add SECURITY_HEADERS to an Astro response (its headers may be immutable). */
function secure(response: Response): Response {
	const secured = new Response(response.body, response);
	for (const [name, value] of SECURITY_HEADERS) {
		// On-demand pages already carry Astro's script/style CSP: a second
		// policy is enforced alongside it, so append instead of replacing.
		const current = secured.headers.get(name);
		if (current === null) secured.headers.set(name, value);
		else if (name === 'Content-Security-Policy' && !current.includes(value)) secured.headers.append(name, value);
	}
	return secured;
}

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
			const destination = redirects.get(slug);
			if (destination) {
				if (method === 'GET') {
					ctx.waitUntil(
						recordClick(slug).catch((err) => console.error('[analytics] track failed', slug, err)),
					);
				}
				// Most visitors only ever see this 302: it carries HSTS too.
				return new Response(null, {
					status: 302,
					headers: { Location: destination, 'Strict-Transport-Security': HSTS },
				});
			}

			// Stats query D1: share one response per colo for its max-age.
			// The key drops the query string so `?x=` can't bypass the cache.
			if (method === 'GET' && EDGE_CACHED.test(pathname)) {
				const cache = await caches.open('ssr');
				const key = new Request(origin + pathname);
				const hit = await cache.match(key);
				if (hit) return hit;

				const response = secure(await handle(request, env, ctx));
				if (response.status === 200 && /\bmax-age=\d/.test(response.headers.get('Cache-Control') ?? '')) {
					ctx.waitUntil(cache.put(key, response.clone()));
				}
				return response;
			}
		}

		return secure(await handle(request, env, ctx));
	},
} satisfies ExportedHandler<Env>;

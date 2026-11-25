// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Every page is prerendered and served as a free static asset. Only requests
// that match no file reach the Worker (`src/worker.ts`): short-link redirects
// are answered there before Astro runs; /api/* and /stats/* render on demand.
export default defineConfig({
	site: 'https://midu.link',
	trailingSlash: 'ignore',
	// `/mwc` → mwc.html, so static assets serve it without a trailing-slash redirect.
	build: { format: 'file', inlineStylesheets: 'always' },
	// No sessions or image transforms: skip the KV and Images bindings.
	session: false,
	adapter: cloudflare({ imageService: 'passthrough' }),
	// Content-Security-Policy <meta> with a hash for every script and style Astro
	// renders, so no inline code runs unless it ships with the page.
	// `frame-ancestors` only works as a header: see public/_headers and src/worker.ts.
	security: {
		csp: {
			directives: [
				"default-src 'self'",
				"img-src 'self' data:",
				"font-src 'self'",
				"connect-src 'self'",
				"base-uri 'self'",
				"object-src 'none'",
				"form-action 'self'",
			],
			// /stats/<slug> sizes its bars with style="" attributes, which cannot run code.
			styleDirective: {
				resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
			},
		},
	},
});

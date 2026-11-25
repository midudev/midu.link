// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
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
	// Self-hosted Latin subsets (src/assets/fonts) without stylistic alternates.
	// Astro serves them from /_astro/fonts with a content hash (immutable cache),
	// writes the @font-face rules and a metric-matched fallback (size-adjust,
	// ascent-override) so text doesn't shift when the font swaps in.
	// Pages use them through <Font cssVariable="…" />.
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Geist Mono',
			cssVariable: '--font-geist-mono',
			fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
			options: { variants: [{ src: ['./src/assets/fonts/geist-mono.woff2'], weight: '400 700', style: 'normal' }] },
		},
		{
			provider: fontProviders.local(),
			name: 'Geist Pixel',
			cssVariable: '--font-geist-pixel',
			fallbacks: ['ui-monospace', 'monospace'],
			options: { variants: [{ src: ['./src/assets/fonts/geist-pixel-square.woff2'], weight: '400', style: 'normal' }] },
		},
		{
			provider: fontProviders.local(),
			name: 'Geist',
			cssVariable: '--font-geist',
			fallbacks: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
			options: { variants: [{ src: ['./src/assets/fonts/geist.woff2'], weight: '400 600', style: 'normal' }] },
		},
	],
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

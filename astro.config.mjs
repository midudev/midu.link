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
});

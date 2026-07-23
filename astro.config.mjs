// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Short-link redirects are handled at runtime by `src/middleware.ts`
// so we can record clicks without delaying the 302 response.
// The site stays static; only routes with `prerender = false` (e.g. /api/stats)
// become serverless functions.
export default defineConfig({
  site: 'https://midu.link',
  trailingSlash: 'ignore',
  adapter: vercel(),
});

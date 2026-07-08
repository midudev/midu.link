// @ts-check
import { defineConfig } from 'astro/config';
import links from './src/data/links.json';

import vercel from '@astrojs/vercel';

// 302 (temporary) redirects: a URL shortener's destinations change over time,
// and a permanent 301 gets cached by browsers forever, breaking future updates.
const redirects = Object.fromEntries(
  links.map(({ slug, url }) => [`/${slug}`, { status: 302, destination: url }])
);

export default defineConfig({
  site: 'https://midu.link',
  trailingSlash: 'ignore',
  redirects,
  adapter: vercel(),
});

// @ts-check
import { defineConfig } from 'astro/config';
import links from './src/data/links.json';

import vercel from '@astrojs/vercel';

const redirects = Object.fromEntries(
  links.map(({ slug, url }) => [`/${slug}`, url])
);

export default defineConfig({
  redirects,
  adapter: vercel(),
});
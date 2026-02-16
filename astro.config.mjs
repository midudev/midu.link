// @ts-check
import { defineConfig } from 'astro/config';
import links from './src/data/links.json';

const redirects = Object.fromEntries(
  links.map(({ slug, url }) => [`/${slug}`, url])
);

export default defineConfig({
  redirects,
});

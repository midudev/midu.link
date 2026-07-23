import links from '../data/links.json';

export type Link = { slug: string; url: string };

const linkList = links as Link[];

/** O(1) slug → destination URL. */
export const linksBySlug = new Map<string, string>(
	linkList.map(({ slug, url }) => [slug, url]),
);

export { linkList as allLinks };

import links from '../data/links.json';

export type Link = {
	slug: string;
	url: string;
	/** ISO date (YYYY-MM-DD) when the short link was first added. */
	created?: string;
};

const linkList = links as Link[];

/** O(1) slug → destination URL. */
export const linksBySlug = new Map<string, string>(
	linkList.map(({ slug, url }) => [slug, url]),
);

export { linkList as allLinks };

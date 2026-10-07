import links from '../data/links.json';

export type Link = {
	slug: string;
	url: string;
	/** ISO date (YYYY-MM-DD) when the short link was first added. */
	created?: string;
};

export type SpecialLanding = {
	slug: string;
	url: string;
	label: string;
	created: string;
};

export const specialLandings: SpecialLanding[] = [
	{
		slug: '42',
		url: 'https://midu.link/42',
		label: 'Charla midudev en 42 Barcelona + Curso Python (13–16 oct)',
		created: '2026-10-07',
	},
	{
		slug: 'aws-nerdearla',
		url: 'https://midu.link/aws-nerdearla',
		label: 'Taller midudev con AWS · Nerdearla 2026',
		created: '2026-09-16',
	},
];

const linkList = links as Link[];

/** O(1) slug → destination URL for short-link redirects. */
export const linksBySlug = new Map<string, string>(
	linkList.map(({ slug, url }) => [slug, url]),
);

/** O(1) slug → destination/label for all trackable items (short links + special landings). */
export const trackableBySlug = new Map<string, string>([
	...linkList.map(({ slug, url }) => [slug, url] as const),
	...specialLandings.map(({ slug, url }) => [slug, url] as const),
]);

export const allTrackableSlugs: string[] = [
	...specialLandings.map((l) => l.slug),
	...linkList.map((l) => l.slug),
];

export { linkList as allLinks };

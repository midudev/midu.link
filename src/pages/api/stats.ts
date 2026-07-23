import type { APIRoute } from 'astro';
import { getStats } from '../../lib/db';
import { allLinks } from '../../lib/links';

export const prerender = false;

export const GET: APIRoute = async () => {
	const slugs = allLinks.map((l) => l.slug);
	const stats = await getStats(slugs);

	return new Response(JSON.stringify(stats), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			// Short cache so the homepage stays snappy but stays fairly fresh.
			'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
		},
	});
};

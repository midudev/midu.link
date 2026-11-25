import type { APIRoute } from 'astro';
import { getStats } from '../../lib/db';
import { allTrackableSlugs } from '../../lib/links';

export const prerender = false;

export const GET: APIRoute = async () => {
	const stats = await getStats(allTrackableSlugs);

	return Response.json(stats, {
		headers: {
			// `src/worker.ts` keeps it in the colo cache for max-age; browsers too.
			'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
		},
	});
};

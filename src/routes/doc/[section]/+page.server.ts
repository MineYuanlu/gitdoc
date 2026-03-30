import type { PageServerLoad } from './$types';
import { REPO_URL } from '$env/static/private';
import { cacheManager } from '$lib/server/git/cache';
import { listDocs } from '$lib/server/docs/reader';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { dir, release } = await cacheManager.acquire(REPO_URL, locals.user!.ghToken);
	try {
		const docs = await listDocs(dir, params.section);
		return { section: params.section, docs };
	} finally {
		release();
	}
};

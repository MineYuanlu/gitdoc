import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { REPO_URL } from '$env/static/private';
import { cacheManager } from '$lib/server/git/cache';
import { hasPermission } from '$lib/server/auth/permissions';
import { listSections, listDocs } from '$lib/server/docs/reader';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/login/github');
	}
	if (!hasPermission(locals.user, 'read')) {
		error(403, '无阅读权限');
	}

	const { dir, release } = await cacheManager.acquire(REPO_URL, locals.user.ghToken);
	try {
		const sectionNames = await listSections(dir);
		const sections = await Promise.all(
			sectionNames.map(async (name) => ({
				name,
				docs: await listDocs(dir, name),
			})),
		);
		return { sections };
	} finally {
		release();
	}
};

import { redirect, fail } from '@sveltejs/kit';
import { REPO_URL } from '$env/static/private';
import { cacheManager } from '$lib/server/git/cache';
import { readConfig } from '$lib/server/config';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = () => {
	if (REPO_URL) redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: '请先登录' });

		const formData = await request.formData();
		const repoUrl = formData.get('repoUrl')?.toString()?.trim();

		if (!repoUrl) return fail(400, { error: '请输入仓库地址' });

		try {
			const { dir, release } = await cacheManager.acquire(repoUrl, locals.user.ghToken);
			try {
				// Verify the repo has a valid structure by reading config
				await readConfig(dir);
			} finally {
				release();
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Clone 失败';
			return fail(400, { error: `无法访问仓库: ${message}` });
		}

		// In a real deployment, REPO_URL would be set via env.
		// For now, redirect to home after successful validation.
		redirect(302, '/');
	},
};

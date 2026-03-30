import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { REPO_URL } from '$env/static/private';
import { cacheManager } from '$lib/server/git/cache';
import { hasPermission } from '$lib/server/auth/permissions';
import { readDoc } from '$lib/server/docs/reader';
import { writeDoc } from '$lib/server/docs/writer';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user!;
	if (!hasPermission(user, 'write')) error(403, '无编辑权限');

	const { dir, release } = await cacheManager.acquire(REPO_URL, user.ghToken);
	try {
		const doc = await readDoc(dir, params.section, params.doc);
		if (!doc) error(404, '文档不存在');
		return {
			section: params.section,
			docName: params.doc,
			doc,
		};
	} finally {
		release();
	}
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const user = locals.user!;
		if (!hasPermission(user, 'write')) error(403, '无编辑权限');

		const formData = await request.formData();
		const content = formData.get('content') as string;

		const { dir, release } = await cacheManager.acquire(REPO_URL, user.ghToken);
		try {
			const existing = await readDoc(dir, params.section, params.doc);
			await writeDoc(dir, params.section, params.doc, content, user, user.ghToken, {
				createdAt: existing?.createdAt,
			});
		} finally {
			release();
		}

		redirect(303, `/doc/${params.section}/${params.doc}`);
	},
};

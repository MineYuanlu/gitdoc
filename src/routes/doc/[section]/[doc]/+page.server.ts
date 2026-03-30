import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { REPO_URL } from '$env/static/private';
import { cacheManager } from '$lib/server/git/cache';
import { hasPermission } from '$lib/server/auth/permissions';
import { readDoc, readComments } from '$lib/server/docs/reader';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user!;
	const { dir, release } = await cacheManager.acquire(REPO_URL, user.ghToken);
	try {
		const doc = await readDoc(dir, params.section, params.doc);
		if (!doc) error(404, '文档不存在');
		const comments = await readComments(dir, params.section, params.doc);
		return {
			section: params.section,
			docName: params.doc,
			doc,
			comments,
			canEdit: hasPermission(user, 'write'),
			canComment: hasPermission(user, 'comment'),
		};
	} finally {
		release();
	}
};

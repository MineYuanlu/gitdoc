import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { REPO_URL } from '$env/static/private';
import { cacheManager } from '$lib/server/git/cache';
import { hasPermission } from '$lib/server/auth/permissions';
import { addComment } from '$lib/server/docs/writer';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const user = locals.user;
	if (!user) error(401, '未登录');
	if (!hasPermission(user, 'comment')) error(403, '无评论权限');

	const body = await request.json();
	const content = body.content?.trim();
	if (!content) return json({ message: '评论内容不能为空' }, { status: 400 });

	const { dir, release } = await cacheManager.acquire(REPO_URL, user.ghToken);
	try {
		const sha = await addComment(dir, params.section, params.doc, content, user, user.ghToken, body.replyTo);
		return json({ success: true, commitSha: sha }, { status: 201 });
	} finally {
		release();
	}
};

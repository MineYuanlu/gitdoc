import { redirect, error } from '@sveltejs/kit';
import { exchangeCode, getGitHubUser } from '$lib/server/auth/github';
import { createSession } from '$lib/server/auth/session';
import { getUserPermissions } from '$lib/server/auth/permissions';
import { cacheManager } from '$lib/server/git/cache';
import { readConfig } from '$lib/server/config';
import { REPO_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const savedState = cookies.get('oauth_state');

	cookies.delete('oauth_state', { path: '/' });

	if (!code || !state || state !== savedState) {
		error(400, 'Invalid OAuth state');
	}

	const ghToken = await exchangeCode(code);
	const ghUser = await getGitHubUser(ghToken);
	const userId = `github:${ghUser.id}`;

	// Look up user permissions in the repo
	let permissions: string[] = [];
	if (REPO_URL) {
		const { dir, release } = await cacheManager.acquire(REPO_URL, ghToken);
		try {
			const userInfo = await getUserPermissions(dir, 'github', String(ghUser.id));
			if (userInfo) {
				permissions = userInfo.permissions;
			} else {
				// User not found in repo — use default permissions from config
				const config = await readConfig(dir);
				permissions = config.defaultPermissions;
			}
		} finally {
			release();
		}
	}

	createSession(cookies, {
		userId,
		provider: 'github',
		username: ghUser.login,
		avatar: ghUser.avatar_url,
		permissions,
		ghToken,
	});

	redirect(302, '/');
};

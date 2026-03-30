import type { LayoutServerLoad } from './$types';
import { REPO_URL } from '$env/static/private';

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		user: locals.user
			? {
					userId: locals.user.userId,
					username: locals.user.username,
					avatar: locals.user.avatar,
					permissions: locals.user.permissions,
				}
			: null,
		repoConfigured: !!REPO_URL,
	};
};

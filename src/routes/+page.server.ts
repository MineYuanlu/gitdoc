import type { PageServerLoad } from './$types';
import { REPO_URL } from '$env/static/private';

export const load: PageServerLoad = () => {
	return {
		repoConfigured: !!REPO_URL,
	};
};

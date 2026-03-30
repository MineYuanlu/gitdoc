import { redirect } from '@sveltejs/kit';
import { getAuthUrl } from '$lib/server/auth/github';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies }) => {
	const state = crypto.randomUUID();
	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 600,
	});

	const redirectUri = `${url.origin}/auth/callback/github`;
	const authUrl = getAuthUrl(state, redirectUri);
	redirect(302, authUrl);
};

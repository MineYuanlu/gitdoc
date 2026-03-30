import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/auth/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	destroySession(cookies);
	redirect(302, '/');
};

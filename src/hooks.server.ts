import type { Handle } from '@sveltejs/kit';
import { verifySession } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const session = verifySession(event.cookies);
	if (session) {
		event.locals.user = session;
	}
	return resolve(event);
};

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
	userId: string; // "github:12345"
	provider: 'github';
	username: string;
	avatar: string;
	permissions: string[];
	ghToken: string;
}

/** Create a JWT and set it as an HttpOnly cookie */
export function createSession(cookies: Cookies, payload: SessionPayload): void {
	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
	cookies.set(COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: MAX_AGE,
	});
}

/** Verify and decode the session from the cookie */
export function verifySession(cookies: Cookies): SessionPayload | null {
	const token = cookies.get(COOKIE_NAME);
	if (!token) return null;
	try {
		return jwt.verify(token, JWT_SECRET) as SessionPayload;
	} catch {
		return null;
	}
}

/** Clear the session cookie */
export function destroySession(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

import { readFile } from '../git/operations';
import type { SessionPayload } from './session';

export interface UserInfo {
	username: string;
	avatar: string;
	permissions: string[];
	invitedBy: string;
	createdAt: string;
}

/** Read a user's permission info from the repo */
export async function getUserPermissions(cacheDir: string, provider: string, userId: string): Promise<UserInfo | null> {
	const raw = await readFile(cacheDir, `auth/${provider}/${userId}/info.json`);
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/** Check if a user has a specific permission */
export function hasPermission(user: SessionPayload, required: string): boolean {
	return user.permissions.includes(required) || user.permissions.includes('admin');
}

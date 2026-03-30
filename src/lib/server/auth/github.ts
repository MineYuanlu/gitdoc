import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const USER_URL = 'https://api.github.com/user';

/** Generate the GitHub OAuth authorization URL */
export function getAuthUrl(state: string, redirectUri: string): string {
	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		redirect_uri: redirectUri,
		state,
		scope: 'repo',
	});
	return `${AUTHORIZE_URL}?${params}`;
}

/** Exchange an authorization code for an access token */
export async function exchangeCode(code: string): Promise<string> {
	const res = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code,
		}),
	});
	const data = await res.json();
	if (data.error) throw new Error(data.error_description || data.error);
	return data.access_token;
}

/** Fetch the authenticated GitHub user's profile */
export async function getGitHubUser(token: string): Promise<{ id: number; login: string; avatar_url: string }> {
	const res = await fetch(USER_URL, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
	return res.json();
}

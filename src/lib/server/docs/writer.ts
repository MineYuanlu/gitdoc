import { writeFileAndCommit, pushToRemote, pullLatest } from '../git/operations';
import type { SessionPayload } from '../auth/session';

export interface DocWriteMeta {
	title?: string;
	createdAt?: string;
	updatedAt?: string;
}

/** Create or update a document */
export async function writeDoc(
	cacheDir: string,
	section: string,
	doc: string,
	content: string,
	author: SessionPayload,
	token: string,
	meta?: DocWriteMeta,
): Promise<string> {
	await pullLatest(cacheDir, token);

	const now = new Date().toISOString();
	const frontmatter = [
		'---',
		`title: ${meta?.title || doc}`,
		`author: ${author.userId}`,
		`createdAt: ${meta?.createdAt || now}`,
		`updatedAt: ${now}`,
		'---',
		'',
	].join('\n');

	const sha = await writeFileAndCommit(
		cacheDir,
		`doc/${section}/${doc}/page.md`,
		frontmatter + content,
		{ name: author.username, email: `${author.userId}@gitdoc` },
		`编辑: ${section}/${doc} by @${author.username}`,
	);

	await pushToRemote(cacheDir, token);
	return sha;
}

/** Add a comment to a document */
export async function addComment(
	cacheDir: string,
	section: string,
	doc: string,
	content: string,
	author: SessionPayload,
	token: string,
	replyTo?: string,
): Promise<string> {
	await pullLatest(cacheDir, token);

	const now = new Date().toISOString();
	const userId = author.userId.split(':')[1] || author.userId;
	const filename = `comment-${Date.now()}-${userId}.md`;

	const lines = ['---', `author: ${author.userId}`, `createdAt: ${now}`];
	if (replyTo) lines.push(`replyTo: ${replyTo}`);
	lines.push('---', '', content);

	const sha = await writeFileAndCommit(
		cacheDir,
		`doc/${section}/${doc}/${filename}`,
		lines.join('\n'),
		{ name: author.username, email: `${author.userId}@gitdoc` },
		`评论: ${section}/${doc} by @${author.username}`,
	);

	await pushToRemote(cacheDir, token);
	return sha;
}

import { readFile, listDirectory } from '../git/operations';

export interface DocMeta {
	name: string;
	title: string;
	updatedAt: string;
}

export interface DocContent {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	body: string;
}

export interface Comment {
	id: string;
	author: string;
	createdAt: string;
	replyTo?: string;
	body: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
	const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return { meta: {}, body: raw };
	const meta: Record<string, string> = {};
	for (const line of match[1].split('\n')) {
		const idx = line.indexOf(':');
		if (idx > 0) {
			meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
		}
	}
	return { meta, body: match[2] };
}

/** List all sections (top-level directories under doc/) */
export async function listSections(cacheDir: string): Promise<string[]> {
	const entries = await listDirectory(cacheDir, 'doc');
	return entries.filter((e) => !e.startsWith('.'));
}

/** List documents in a section */
export async function listDocs(cacheDir: string, section: string): Promise<DocMeta[]> {
	const entries = await listDirectory(cacheDir, `doc/${section}`);
	const docs: DocMeta[] = [];
	for (const name of entries) {
		if (name.startsWith('.')) continue;
		const raw = await readFile(cacheDir, `doc/${section}/${name}/page.md`);
		if (!raw) continue;
		const { meta } = parseFrontmatter(raw);
		docs.push({
			name,
			title: meta.title || name,
			updatedAt: meta.updatedAt || meta.createdAt || '',
		});
	}
	return docs;
}

/** Read a document's content with parsed frontmatter */
export async function readDoc(cacheDir: string, section: string, doc: string): Promise<DocContent | null> {
	const raw = await readFile(cacheDir, `doc/${section}/${doc}/page.md`);
	if (!raw) return null;
	const { meta, body } = parseFrontmatter(raw);
	return {
		title: meta.title || doc,
		author: meta.author || '',
		createdAt: meta.createdAt || '',
		updatedAt: meta.updatedAt || '',
		body,
	};
}

/** Read all comments for a document, sorted by timestamp */
export async function readComments(cacheDir: string, section: string, doc: string): Promise<Comment[]> {
	const dir = `doc/${section}/${doc}`;
	const entries = await listDirectory(cacheDir, dir);
	const comments: Comment[] = [];
	for (const entry of entries) {
		if (!entry.startsWith('comment-') || !entry.endsWith('.md')) continue;
		const raw = await readFile(cacheDir, `${dir}/${entry}`);
		if (!raw) continue;
		const { meta, body } = parseFrontmatter(raw);
		comments.push({
			id: entry.replace('.md', ''),
			author: meta.author || '',
			createdAt: meta.createdAt || '',
			replyTo: meta.replyTo || undefined,
			body,
		});
	}
	return comments.sort((a, b) => a.id.localeCompare(b.id));
}

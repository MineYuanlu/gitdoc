import { readFile, listDirectory } from '../git/operations';

export interface SearchResult {
	section: string;
	doc: string;
	title: string;
	excerpt: string;
	score: number;
}

/** Full-text search across all documents */
export async function searchDocs(cacheDir: string, query: string): Promise<SearchResult[]> {
	if (!query.trim()) return [];

	const keywords = query.toLowerCase().split(/\s+/);
	const results: SearchResult[] = [];

	const sections = await listDirectory(cacheDir, 'doc');
	for (const section of sections) {
		if (section.startsWith('.')) continue;
		const docs = await listDirectory(cacheDir, `doc/${section}`);
		for (const doc of docs) {
			if (doc.startsWith('.')) continue;
			const raw = await readFile(cacheDir, `doc/${section}/${doc}/page.md`);
			if (!raw) continue;

			const lower = raw.toLowerCase();
			let score = 0;
			for (const kw of keywords) {
				const idx = lower.indexOf(kw);
				if (idx >= 0) score++;
			}
			if (score === 0) continue;

			// Extract title from frontmatter
			const titleMatch = raw.match(/^title:\s*(.+)$/m);
			const title = titleMatch?.[1] || doc;

			// Build excerpt around first match
			const firstKw = keywords.find((kw) => lower.includes(kw))!;
			const pos = lower.indexOf(firstKw);
			const start = Math.max(0, pos - 40);
			const end = Math.min(raw.length, pos + firstKw.length + 40);
			const excerpt = (start > 0 ? '...' : '') + raw.slice(start, end) + (end < raw.length ? '...' : '');

			results.push({ section, doc, title, excerpt, score });
		}
	}

	return results.sort((a, b) => b.score - a.score);
}

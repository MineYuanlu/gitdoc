import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { cloneRepo, pullLatest } from './operations';

const CACHE_BASE = path.resolve('workdir/caches');
const TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
	lastPull: number;
	writeLock: Promise<void> | null;
	releaseWrite: (() => void) | null;
}

const entries = new Map<string, CacheEntry>();

function getCacheDir(repoUrl: string): string {
	const hash = createHash('sha256').update(repoUrl).digest('hex');
	return path.join(CACHE_BASE, hash);
}

function getEntry(repoUrl: string): CacheEntry {
	let entry = entries.get(repoUrl);
	if (!entry) {
		entry = { lastPull: 0, writeLock: null, releaseWrite: null };
		entries.set(repoUrl, entry);
	}
	return entry;
}

export const cacheManager = {
	/**
	 * Acquire a cached repo directory.
	 * Clones if missing, pulls if stale. Returns a dir path and a release function for write locks.
	 */
	async acquire(repoUrl: string, token: string): Promise<{ dir: string; release: () => void }> {
		const dir = getCacheDir(repoUrl);
		const entry = getEntry(repoUrl);

		// Wait for any pending write to finish
		if (entry.writeLock) {
			await entry.writeLock;
		}

		const exists = fs.existsSync(path.join(dir, '.git'));

		if (!exists) {
			await fs.promises.mkdir(dir, { recursive: true });
			await cloneRepo(repoUrl, dir, token);
			entry.lastPull = Date.now();
		} else if (Date.now() - entry.lastPull > TTL_MS) {
			await pullLatest(dir, token);
			entry.lastPull = Date.now();
		}

		// Set up write lock
		let releaseFn: () => void = () => {};
		entry.writeLock = new Promise<void>((resolve) => {
			releaseFn = resolve;
		});

		return {
			dir,
			release() {
				entry.writeLock = null;
				releaseFn();
			},
		};
	},

	/** Force invalidate cache so next acquire re-clones */
	invalidate(repoUrl: string): void {
		const dir = getCacheDir(repoUrl);
		entries.delete(repoUrl);
		fs.rmSync(dir, { recursive: true, force: true });
	},

	/** Get the cache directory path for a repo URL (without acquiring) */
	getCacheDir,
};

import git from 'isomorphic-git';
import * as fs from 'node:fs';
import http from './http';

/** Clone a remote repo to a local cache directory */
export async function cloneRepo(url: string, dir: string, token: string): Promise<void> {
	await git.clone({
		fs,
		http,
		dir,
		url,
		singleBranch: true,
		depth: 1,
		onAuth: () => ({ username: 'x-access-token', password: token }),
	});
}

/** Pull latest changes from remote */
export async function pullLatest(dir: string, token: string): Promise<void> {
	await git.pull({
		fs,
		http,
		dir,
		singleBranch: true,
		author: { name: 'GitDoc', email: 'gitdoc@localhost' },
		onAuth: () => ({ username: 'x-access-token', password: token }),
	});
}

/** Read a file from the working tree, returns null if not found */
export async function readFile(dir: string, filepath: string): Promise<string | null> {
	try {
		return await fs.promises.readFile(`${dir}/${filepath}`, 'utf-8');
	} catch {
		return null;
	}
}

/** List entries in a directory (files and subdirectories) */
export async function listDirectory(dir: string, dirpath: string): Promise<string[]> {
	try {
		return await fs.promises.readdir(`${dir}/${dirpath}`);
	} catch {
		return [];
	}
}

/** Write a file and create a commit, returns the commit SHA */
export async function writeFileAndCommit(
	dir: string,
	filepath: string,
	content: string,
	author: { name: string; email: string },
	message: string,
): Promise<string> {
	const fullPath = `${dir}/${filepath}`;
	await fs.promises.mkdir(fullPath.substring(0, fullPath.lastIndexOf('/')), { recursive: true });
	await fs.promises.writeFile(fullPath, content, 'utf-8');
	await git.add({ fs, dir, filepath });
	const sha = await git.commit({ fs, dir, message, author });
	return sha;
}

/** Push local commits to the remote */
export async function pushToRemote(dir: string, token: string): Promise<void> {
	await git.push({
		fs,
		http,
		dir,
		onAuth: () => ({ username: 'x-access-token', password: token }),
	});
}

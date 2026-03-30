import { readFile } from './git/operations';

export interface SiteConfig {
	title: string;
	description: string;
	defaultPermissions: string[];
	apiKeys: { key: string; name: string; permissions: string[] }[];
}

const DEFAULT_CONFIG: SiteConfig = {
	title: 'GitDoc',
	description: '',
	defaultPermissions: ['read'],
	apiKeys: [],
};

/** Read config.json from the cached repo */
export async function readConfig(cacheDir: string): Promise<SiteConfig> {
	const raw = await readFile(cacheDir, 'config.json');
	if (!raw) return DEFAULT_CONFIG;
	try {
		return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
	} catch {
		return DEFAULT_CONFIG;
	}
}

/** Serialize config to JSON string */
export function serializeConfig(config: SiteConfig): string {
	return JSON.stringify(config, null, '\t') + '\n';
}

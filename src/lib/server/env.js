import fs from 'node:fs';
import path from 'node:path';

/** @type {Record<string, string> | null} */
let cachedEnv = null;

function loadLocalEnv() {
	if (cachedEnv) return cachedEnv;
	cachedEnv = {};
	try {
		const envPath = path.resolve(process.cwd(), '.env');
		if (fs.existsSync(envPath)) {
			const content = fs.readFileSync(envPath, 'utf8');
			const lines = content.split(/\r?\n/);
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || trimmed.startsWith('#')) continue;
				const eqIndex = trimmed.indexOf('=');
				if (eqIndex > 0) {
					const key = trimmed.slice(0, eqIndex).trim();
					let val = trimmed.slice(eqIndex + 1).trim();
					if (
						(val.startsWith('"') && val.endsWith('"')) ||
						(val.startsWith("'") && val.endsWith("'"))
					) {
						val = val.slice(1, -1);
					}
					cachedEnv[key] = val;
				}
			}
		}
	} catch (e) {
		console.warn('Failed to read .env file:', e);
	}
	return cachedEnv;
}

/**
 * Gets a server environment variable with bulletproof fallback across process.env and .env file
 * @param {string} key
 * @returns {string}
 */
export function getEnv(key) {
	if (process.env[key]) {
		return process.env[key].trim();
	}
	const local = loadLocalEnv();
	return (local[key] || '').trim();
}

import { searchImages } from './imageSearch.js';

/**
 * @typedef {Object} BulkGeneratedItem
 * @property {string} name
 * @property {string} searchQuery
 */

/**
 * @typedef {Object} BulkResolvedItem
 * @property {string} name
 * @property {string} imageUrl
 * @property {string} [sourceUrl]
 */

/**
 * Calls the bulk item generation API
 * @param {string} prompt
 * @param {string} [context]
 * @param {string[]} [existingNames]
 * @param {number} [count]
 * @returns {Promise<{ items: BulkGeneratedItem[]; error?: string; message?: string }>}
 */
export async function fetchBulkItems(prompt, context = '', existingNames = [], count = 15) {
	try {
		const res = await fetch('/api/ai/bulk', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt, context, existingNames, count })
		});

		const data = await res.json();
		if (!res.ok || data.error) {
			return {
				items: [],
				error: data.error || 'BULK_GEN_FAILED',
				message: data.message || 'Failed to generate items with AI.'
			};
		}

		return {
			items: Array.isArray(data.items) ? data.items : []
		};
	} catch (e) {
		console.error('Fetch bulk items error:', e);
		return {
			items: [],
			error: 'NETWORK_ERROR',
			message: 'Could not connect to AI generation service.'
		};
	}
}

/**
 * Calls the query disambiguation API
 * @param {string} query
 * @param {string} [context]
 * @returns {Promise<{ canonicalName: string; searchQuery: string; category?: string; error?: string; message?: string }>}
 */
export async function fetchDisambiguation(query, context = '') {
	try {
		const res = await fetch('/api/ai/disambiguate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, context })
		});

		const data = await res.json();
		if (!res.ok && data.error && data.error !== 'DISAMBIGUATION_FAILED') {
			return {
				canonicalName: query,
				searchQuery: context ? `${query} ${context}` : query,
				error: data.error,
				message: data.message
			};
		}

		return {
			canonicalName: data.canonicalName || query,
			searchQuery: data.searchQuery || query,
			category: data.category
		};
	} catch (e) {
		console.error('Fetch disambiguation error:', e);
		return {
			canonicalName: query,
			searchQuery: context ? `${query} ${context}` : query,
			error: 'NETWORK_ERROR',
			message: 'Could not connect to AI service.'
		};
	}
}

/**
 * Calls the auto-rank API
 * @param {Array<{ id: string; name: string }>} items
 * @param {Array<{ id: string; label: string; order: number }>} tiers
 * @param {string} [criteria]
 * @param {string} [context]
 * @returns {Promise<{ rankings: Array<{ itemId: string; tierId: string; reason: string }>; error?: string; message?: string }>}
 */
export async function fetchAutoRank(items, tiers, criteria = '', context = '') {
	try {
		const res = await fetch('/api/ai/rank', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ items, tiers, criteria, context })
		});

		const data = await res.json();
		if (!res.ok || data.error) {
			return {
				rankings: [],
				error: data.error || 'RANKING_FAILED',
				message: data.message || 'Auto-ranking failed.'
			};
		}

		return {
			rankings: Array.isArray(data.rankings) ? data.rankings : []
		};
	} catch (e) {
		console.error('Fetch auto rank error:', e);
		return {
			rankings: [],
			error: 'NETWORK_ERROR',
			message: 'Could not connect to AI ranking service.'
		};
	}
}

/**
 * Calls the dynamic suggestions API
 * @param {string} title
 * @param {string} [context]
 * @param {string[]} [existingNames]
 * @param {number} [count]
 * @returns {Promise<{ suggestions: string[]; error?: string; message?: string }>}
 */
export async function fetchSuggestions(title, context = '', existingNames = [], count = 8) {
	try {
		const res = await fetch('/api/ai/suggest', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title, context, existingNames, count })
		});

		const data = await res.json();
		if (!res.ok || data.error) {
			return {
				suggestions: [],
				error: data.error || 'SUGGESTIONS_FAILED',
				message: data.message || 'Failed to fetch suggestions.'
			};
		}

		return {
			suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
		};
	} catch (e) {
		console.error('Fetch suggestions error:', e);
		return {
			suggestions: [],
			error: 'NETWORK_ERROR',
			message: 'Could not connect to suggestions service.'
		};
	}
}

/**
 * Resolves images in parallel chunks with progress callback
 * @param {BulkGeneratedItem[]} items
 * @param {(progress: { current: number; total: number; currentItemName: string }) => void} [onProgress]
 * @param {number} [concurrency]
 * @returns {Promise<BulkResolvedItem[]>}
 */
export async function resolveBatchImages(items, onProgress, concurrency = 5) {
	/** @type {BulkResolvedItem[]} */
	const results = [];
	let completed = 0;

	// Process items in chunks
	for (let i = 0; i < items.length; i += concurrency) {
		const chunk = items.slice(i, i + concurrency);

		const chunkPromises = chunk.map(async (item) => {
			try {
				const searchRes = await searchImages(item.searchQuery || item.name);
				const topResult = searchRes.results?.[0];

				completed++;
				onProgress?.({
					current: completed,
					total: items.length,
					currentItemName: item.name
				});

				return {
					name: item.name,
					imageUrl: topResult?.imageUrl || '',
					sourceUrl: topResult?.sourceUrl || undefined
				};
			} catch (err) {
				console.warn(`Failed image lookup for ${item.name}:`, err);
				completed++;
				onProgress?.({
					current: completed,
					total: items.length,
					currentItemName: item.name
				});

				return {
					name: item.name,
					imageUrl: '',
					sourceUrl: undefined
				};
			}
		});

		const chunkResults = await Promise.all(chunkPromises);
		results.push(...chunkResults);
	}

	return results;
}

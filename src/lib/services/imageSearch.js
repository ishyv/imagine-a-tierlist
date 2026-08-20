import { getCachedSearchResults, cacheSearchResults } from '#lib/services/searchCache.js';

/**
 * @typedef {import('#lib/types.js').ImageSearchResult} ImageSearchResult
 */

/**
 * Builds the effective search query from item name and optional board context
 * @param {string} itemName
 * @param {string} [boardContext]
 * @returns {string}
 */
export function buildSearchQuery(itemName, boardContext = '') {
	const trimmedName = (itemName || '').trim().replace(/\s+/g, ' ');
	const trimmedContext = (boardContext || '').trim().replace(/\s+/g, ' ');

	if (!trimmedName) return '';
	if (!trimmedContext) return trimmedName;

	return `${trimmedName} ${trimmedContext}`;
}

/**
 * @typedef {Object} SearchResponse
 * @property {ImageSearchResult[]} results
 * @property {string} [query]
 * @property {boolean} [fromCache]
 * @property {string} [error]
 * @property {string} [message]
 */

/**
 * Searches for images using local cache first, then backend endpoint
 * @param {string} query
 * @param {boolean} [bypassCache]
 * @returns {Promise<SearchResponse>}
 */
export async function searchImages(query, bypassCache = false) {
	const trimmed = (query || '').trim();
	if (!trimmed) {
		return { results: [], error: 'EMPTY_QUERY', message: 'Please enter a search term.' };
	}

	// 1. Check client-side LRU cache first (0ms latency, zero API calls)
	if (!bypassCache) {
		const cached = getCachedSearchResults(trimmed);
		if (cached && cached.length > 0) {
			return {
				results: cached,
				query: trimmed,
				fromCache: true
			};
		}
	}

	// 2. Fetch from backend endpoint
	try {
		const res = await fetch(`/api/images?q=${encodeURIComponent(trimmed)}`);
		const data = await res.json();

		if (!res.ok || data.error) {
			return {
				results: [],
				error: data.error || 'IMAGE_SEARCH_FAILED',
				message: data.message || 'Image search failed. Try again or use a direct image URL.'
			};
		}

		const results = Array.isArray(data.results) ? data.results : [];

		// Cache successful results
		if (results.length > 0) {
			cacheSearchResults(trimmed, results);
		}

		return {
			results,
			query: data.query || trimmed,
			fromCache: false
		};
	} catch (e) {
		console.error('Image search network error:', e);
		return {
			results: [],
			error: 'NETWORK_ERROR',
			message: 'Network error while contacting image search API. Please check your connection.'
		};
	}
}

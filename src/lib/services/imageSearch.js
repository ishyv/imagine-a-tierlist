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
 * @property {string} [error]
 * @property {string} [message]
 */

/**
 * Searches for images using the backend endpoint
 * @param {string} query
 * @returns {Promise<SearchResponse>}
 */
export async function searchImages(query) {
	const trimmed = (query || '').trim();
	if (!trimmed) {
		return { results: [], error: 'EMPTY_QUERY', message: 'Please enter a search term.' };
	}

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

		return {
			results: Array.isArray(data.results) ? data.results : [],
			query: data.query || trimmed
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

/**
 * Search Query Cache Service
 * Provides client-side LRU caching for image search queries to reduce latency to 0ms and save API quota.
 */

const SEARCH_CACHE_KEY = 'tierlist-search-cache-v1';
const MAX_CACHE_ENTRIES = 120;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * @typedef {Object} CacheEntry
 * @property {number} timestamp
 * @property {import('#lib/types.js').ImageSearchResult[]} results
 */

/**
 * Normalizes query string for cache keying
 * @param {string} query
 * @returns {string}
 */
function normalizeCacheKey(query) {
	return (query || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Loads entire cache map from localStorage
 * @returns {Record<string, CacheEntry>}
 */
function loadCacheMap() {
	if (typeof window === 'undefined') return {};
	try {
		const raw = localStorage.getItem(SEARCH_CACHE_KEY);
		if (!raw) return {};
		return JSON.parse(raw) || {};
	} catch (e) {
		console.warn('Failed to load search cache:', e);
		return {};
	}
}

/**
 * Saves cache map to localStorage with LRU eviction
 * @param {Record<string, CacheEntry>} map
 */
function saveCacheMap(map) {
	if (typeof window === 'undefined') return;
	try {
		// Evict oldest entries if exceeding MAX_CACHE_ENTRIES
		const entries = Object.entries(map);
		if (entries.length > MAX_CACHE_ENTRIES) {
			entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
			const trimmedMap = Object.fromEntries(entries.slice(0, MAX_CACHE_ENTRIES));
			localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(trimmedMap));
			return;
		}
		localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(map));
	} catch (e) {
		console.warn('Failed to save search cache:', e);
	}
}

/**
 * Retrieves cached search results if valid and not expired
 * @param {string} query
 * @returns {import('#lib/types.js').ImageSearchResult[] | null}
 */
export function getCachedSearchResults(query) {
	const key = normalizeCacheKey(query);
	if (!key) return null;

	const map = loadCacheMap();
	const entry = map[key];
	if (!entry || !Array.isArray(entry.results) || entry.results.length === 0) {
		return null;
	}

	// Check expiration
	if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
		delete map[key];
		saveCacheMap(map);
		return null;
	}

	return entry.results;
}

/**
 * Stores search results in the cache
 * @param {string} query
 * @param {import('#lib/types.js').ImageSearchResult[]} results
 */
export function cacheSearchResults(query, results) {
	const key = normalizeCacheKey(query);
	if (!key || !Array.isArray(results) || results.length === 0) return;

	const map = loadCacheMap();
	map[key] = {
		timestamp: Date.now(),
		results
	};
	saveCacheMap(map);
}

/**
 * Clears entire search cache
 */
export function clearSearchCache() {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(SEARCH_CACHE_KEY);
	} catch (e) {
		console.warn('Failed to clear search cache:', e);
	}
}

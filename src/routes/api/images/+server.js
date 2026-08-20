import { json } from '@sveltejs/kit';
import { getEnv } from '#lib/server/env.js';

// Domains or patterns that produce watermarked stock photos or commerce spam
const JUNK_PATTERNS = [
	'thumbs.redditmedia.com',
	'external-preview.redd.it',
	'etsy.com',
	'ebay.com',
	'aliexpress.com',
	'shutterstock.com',
	'alamy.com',
	'gettyimages.com',
	'istockphoto.com'
];

/**
 * Normalizes user search query:
 * - Trims leading/trailing whitespace
 * - Collapses consecutive whitespace characters
 * - Limits max length
 * @param {string} raw
 * @returns {string}
 */
function normalizeQuery(raw) {
	if (!raw || typeof raw !== 'string') return '';
	return raw.trim().replace(/\s+/g, ' ').slice(0, 150);
}

/**
 * Checks if an image result is junk / stock watermark / commerce listing
 * @param {string} url
 * @param {string} source
 * @returns {boolean}
 */
function isJunkImage(url, source) {
	const lowerUrl = (url || '').toLowerCase();
	const lowerSource = (source || '').toLowerCase();
	return JUNK_PATTERNS.some(
		(pattern) => lowerUrl.includes(pattern) || lowerSource.includes(pattern)
	);
}

/**
 * Searches Google Images via Serper.dev API
 * @param {string} query
 * @param {string} apiKey
 * @returns {Promise<import('#lib/types.js').ImageSearchResult[]>}
 */
async function searchSerper(query, apiKey) {
	try {
		const response = await fetch('https://google.serper.dev/images', {
			method: 'POST',
			headers: {
				'X-API-KEY': apiKey.trim(),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				q: query,
				num: 12
			})
		});

		if (!response.ok) {
			const errText = await response.text().catch(() => '');
			console.error(`Serper API error (${response.status}):`, errText);
			return [];
		}

		const data = await response.json();
		const images = Array.isArray(data?.images) ? data.images : [];

		return images
			.map((/** @type {any} */ item, /** @type {number} */ index) => {
				const fullImg = item.imageUrl || item.thumbnailUrl || '';
				const thumbImg = item.thumbnailUrl || item.imageUrl || '';
				const source = item.link || item.domain || '';

				return {
					id: `serper-${index}-${Date.now()}`,
					title: item.title || query,
					thumbnailUrl: thumbImg,
					imageUrl: fullImg,
					sourceUrl: source.startsWith('http') ? source : `https://${source}`
				};
			})
			.filter(
				(/** @type {any} */ item) =>
					Boolean(item.imageUrl && item.thumbnailUrl) && !isJunkImage(item.imageUrl, item.sourceUrl)
			);
	} catch (e) {
		console.warn('Serper Google Images search error:', e);
		return [];
	}
}

/**
 * Searches Brave Search Image API
 * @param {string} query
 * @param {string} apiKey
 * @returns {Promise<import('#lib/types.js').ImageSearchResult[]>}
 */
async function searchBrave(query, apiKey) {
	/** @type {import('#lib/types.js').ImageSearchResult[]} */
	const results = [];
	const seenUrls = new Set();

	try {
		const braveUrl = new URL('https://api.search.brave.com/res/v1/images/search');
		braveUrl.searchParams.set('q', `${query} official art`);
		braveUrl.searchParams.set('count', '12');
		braveUrl.searchParams.set('safesearch', 'off');

		const response = await fetch(braveUrl.toString(), {
			headers: {
				Accept: 'application/json',
				'Accept-Encoding': 'gzip',
				'X-Subscription-Token': apiKey.trim()
			}
		});

		if (!response.ok) {
			const errText = await response.text().catch(() => '');
			console.error(`Brave Search API error (${response.status}):`, errText);
			return [];
		}

		const data = await response.json();
		const resultsRaw = Array.isArray(data?.results) ? data.results : [];

		for (let index = 0; index < resultsRaw.length; index++) {
			const item = resultsRaw[index];
			const fullImg = item.properties?.url || item.thumbnail?.src || '';
			const thumbImg = item.thumbnail?.src || item.properties?.url || '';
			const source = item.url || '';

			if (fullImg && !seenUrls.has(fullImg) && !isJunkImage(fullImg, source)) {
				seenUrls.add(fullImg);
				results.push({
					id: `brave-${results.length}-${Date.now()}`,
					title: item.title || query,
					thumbnailUrl: thumbImg,
					imageUrl: fullImg,
					sourceUrl: source
				});
			}
		}
	} catch (e) {
		console.warn('Brave search error:', e);
	}

	return results;
}

/**
 * Searches Wikipedia and Wikimedia Commons API for free high-quality images
 * @param {string} query
 * @returns {Promise<import('#lib/types.js').ImageSearchResult[]>}
 */
async function searchWikipedia(query) {
	try {
		const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=8&prop=pageimages&pithumbsize=600&format=json&origin=*`;
		const response = await fetch(searchUrl);
		if (!response.ok) return [];

		const data = await response.json();
		const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

		/** @type {import('#lib/types.js').ImageSearchResult[]} */
		const results = [];

		for (const page of /** @type {any[]} */ (pages)) {
			if (page.thumbnail?.source) {
				const imgUrl = page.thumbnail.source;
				const pageTitle = page.title || query;
				results.push({
					id: `wiki-${page.pageid || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
					title: pageTitle,
					thumbnailUrl: imgUrl,
					imageUrl: imgUrl,
					sourceUrl: `https://en.wikipedia.org/?curid=${page.pageid}`
				});
			}
		}

		return results;
	} catch (e) {
		console.warn('Wikipedia image search error:', e);
		return [];
	}
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, setHeaders }) {
	try {
		const rawQuery = url.searchParams.get('q') || '';
		const query = normalizeQuery(rawQuery);

		if (!query) {
			return json(
				{ error: 'QUERY_REQUIRED', message: 'A search query is required.' },
				{ status: 400 }
			);
		}

		const serperKey = getEnv('SERPER_API_KEY');
		const braveKey = getEnv('BRAVE_SEARCH_API_KEY');

		/** @type {import('#lib/types.js').ImageSearchResult[]} */
		let candidates = [];

		// Priority 1: Serper.dev Google Images (gold standard for official art and characters)
		if (serperKey) {
			const serperResults = await searchSerper(query, serperKey);
			if (serperResults.length > 0) {
				candidates.push(...serperResults);
			}
		}

		// Priority 2: Brave Image Search fallback
		if (candidates.length < 8 && braveKey) {
			const braveResults = await searchBrave(query, braveKey);
			if (braveResults.length > 0) {
				candidates.push(...braveResults);
			}
		}

		// Priority 3: Wikipedia / Wikimedia Commons fallback (free, official assets)
		if (candidates.length < 4) {
			try {
				const wikiResults = await searchWikipedia(query);
				if (Array.isArray(wikiResults) && wikiResults.length > 0) {
					candidates.push(...wikiResults);
				}
			} catch (e) {
				console.warn('Wikipedia image fallback failed:', e);
			}
		}

		// Deduplicate candidates by image URL and ensure valid HTTP(S) URLs
		const seenUrls = new Set();
		const results = [];

		for (const item of candidates) {
			if (
				item.imageUrl &&
				(item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')) &&
				!seenUrls.has(item.imageUrl) &&
				!isJunkImage(item.imageUrl, item.sourceUrl)
			) {
				seenUrls.add(item.imageUrl);
				results.push({
					id: item.id,
					title: item.title,
					thumbnailUrl: item.thumbnailUrl,
					imageUrl: item.imageUrl,
					sourceUrl: item.sourceUrl
				});
			}
			if (results.length >= 8) break;
		}

		setHeaders({
			'Cache-Control': 'private, max-age=120'
		});

		return json({
			query,
			results
		});
	} catch (e) {
		console.error('Image search server route error:', e);
		return json(
			{ error: 'SERVER_ERROR', message: 'Failed to complete image search request.', results: [] },
			{ status: 500 }
		);
	}
}

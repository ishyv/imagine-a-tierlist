import { json } from '@sveltejs/kit';
import { searchImagesWithAi, getOpenRouterApiKey } from '#lib/server/openrouter.js';

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
 * Searches Wikimedia Commons and Wikipedia for public image results
 * @param {string} query
 * @returns {Promise<import('#lib/types.js').ImageSearchResult[]>}
 */
async function searchWikimedia(query) {
	const results = [];

	try {
		// 1. Search Wikipedia page images
		const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=pageimages|info&inprop=url&pithumbsize=600&origin=*`;
		const wikiRes = await fetch(wikiUrl);
		if (wikiRes.ok) {
			const wikiData = await wikiRes.json();
			const pages = Object.values(wikiData?.query?.pages || {});
			for (const page of pages) {
				if (page.thumbnail?.source) {
					results.push({
						id: `wiki-${page.pageid}-${Date.now()}`,
						title: page.title || query,
						thumbnailUrl: page.thumbnail.source,
						imageUrl: page.thumbnail.source,
						sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`
					});
				}
			}
		}

		// 2. Search Wikimedia Commons files
		const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=600&origin=*`;
		const commonsRes = await fetch(commonsUrl);
		if (commonsRes.ok) {
			const commonsData = await commonsRes.json();
			const pages = Object.values(commonsData?.query?.pages || {});
			for (const page of pages) {
				const info = page.imageinfo?.[0];
				if (info?.thumburl || info?.url) {
					results.push({
						id: `commons-${page.pageid}-${Date.now()}`,
						title: (page.title || query).replace(/^File:/, ''),
						thumbnailUrl: info.thumburl || info.url,
						imageUrl: info.url || info.thumburl,
						sourceUrl:
							info.descriptionurl ||
							`https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
					});
				}
			}
		}
	} catch (e) {
		console.warn('Wikimedia search failed:', e);
	}

	return results;
}

/**
 * Searches Brave Search Image API
 * @param {string} query
 * @param {string} apiKey
 * @returns {Promise<import('#lib/types.js').ImageSearchResult[]>}
 */
async function searchBrave(query, apiKey) {
	try {
		const braveUrl = new URL('https://api.search.brave.com/res/v1/images/search');
		braveUrl.searchParams.set('q', query);
		braveUrl.searchParams.set('count', '8');
		braveUrl.searchParams.set('safesearch', 'moderate');

		const response = await fetch(braveUrl.toString(), {
			headers: {
				Accept: 'application/json',
				'Accept-Encoding': 'gzip',
				'X-Subscription-Token': apiKey
			}
		});

		if (!response.ok) return [];

		const data = await response.json();
		const resultsRaw = Array.isArray(data?.results) ? data.results : [];

		return resultsRaw
			.map((/** @type {any} */ item, /** @type {number} */ index) => {
				const fullImg = item.properties?.url || item.thumbnail?.src || '';
				const thumbImg = item.thumbnail?.src || item.properties?.url || '';

				return {
					id: `brave-${index}-${Date.now()}`,
					title: item.title || query,
					thumbnailUrl: thumbImg,
					imageUrl: fullImg,
					sourceUrl: item.url || ''
				};
			})
			.filter((/** @type {any} */ item) => Boolean(item.imageUrl && item.thumbnailUrl));
	} catch (e) {
		console.warn('Brave search error:', e);
		return [];
	}
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const rawQuery = url.searchParams.get('q') || '';
	const query = normalizeQuery(rawQuery);

	if (!query) {
		return json(
			{ error: 'QUERY_REQUIRED', message: 'A search query is required.' },
			{ status: 400 }
		);
	}

	const braveKey = process.env.BRAVE_SEARCH_API_KEY;
	const openRouterKey = getOpenRouterApiKey();

	/** @type {import('#lib/types.js').ImageSearchResult[]} */
	let candidates = [];

	// Strategy 1: Brave Search API if key configured
	if (braveKey) {
		const braveResults = await searchBrave(query, braveKey);
		if (braveResults.length > 0) {
			candidates = braveResults;
		}
	}

	// Strategy 2: OpenRouter Layered Models (Free Tier -> google/gemma-3-4b-it)
	if (candidates.length === 0 && openRouterKey) {
		const aiResults = await searchImagesWithAi(query);
		if (aiResults.length > 0) {
			candidates.push(...aiResults);
		}
	}

	// Strategy 3: Wikimedia Commons & Wikipedia web images
	if (candidates.length < 4) {
		const wikiResults = await searchWikimedia(query);
		// Deduplicate and append
		const existingUrls = new Set(candidates.map((c) => c.imageUrl));
		for (const w of wikiResults) {
			if (!existingUrls.has(w.imageUrl)) {
				candidates.push(w);
				existingUrls.add(w.imageUrl);
			}
		}
	}

	// Cap at 8 results
	const results = candidates.slice(0, 8);

	if (results.length === 0) {
		return json(
			{
				error: 'NO_IMAGES_FOUND',
				message:
					'No images found for this search. Try refining your keywords or use a direct image URL.'
			},
			{ status: 404 }
		);
	}

	return json({
		query,
		results
	});
}

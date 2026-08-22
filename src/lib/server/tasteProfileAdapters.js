import { getEnv } from '#lib/server/env.js';

/**
 * @typedef {import('#lib/types.js').EnrichedItem} EnrichedItem
 * @typedef {import('#lib/types.js').JudgeProfileId} JudgeProfileId
 */

const DEFAULT_TIMEOUT_MS = 8000;
/** @type {string | null} */
let cachedIgdbToken = null;
let musicBrainzNextAvailableAt = 0;

class ProviderUnavailableError extends Error {
	/** @param {string} provider @param {string} message */
	constructor(provider, message) {
		super(message);
		this.name = 'ProviderUnavailableError';
		this.provider = provider;
	}
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function cleanText(value) {
	return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function stripHtml(value) {
	return cleanText(typeof value === 'string' ? value.replace(/<[^>]+>/g, ' ') : '');
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizedName(value) {
	return cleanText(value)
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/**
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {number} [timeoutMs]
 * @returns {Promise<any>}
 */
async function fetchJson(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, { ...options, signal: controller.signal });
		if (!response.ok) {
			throw new Error(`Upstream request failed with status ${response.status}`);
		}
		return await response.json();
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * @param {string} provider
 * @param {string} url
 * @param {string} [label]
 * @returns {import('#lib/types.js').TasteProfileSource}
 */
function source(provider, url, label = provider) {
	return { provider, url, label };
}

/**
 * @param {Record<string, unknown>[]} candidates
 * @param {string} requestedName
 * @param {string | ((candidate: Record<string, unknown>) => string)} [nameKey]
 * @returns {Record<string, unknown> | null}
 */
function chooseCandidate(candidates, requestedName, nameKey = 'name') {
	const requested = normalizedName(requestedName);
	return (
		candidates
			.filter((candidate) => candidate && typeof candidate === 'object')
			.sort((a, b) => {
				const aValue = typeof nameKey === 'function' ? nameKey(a) : a[nameKey];
				const bValue = typeof nameKey === 'function' ? nameKey(b) : b[nameKey];
				const aName = normalizedName(String(aValue || a.title || a.name || ''));
				const bName = normalizedName(String(bValue || b.title || b.name || ''));
				const aExact = aName === requested ? 1 : 0;
				const bExact = bName === requested ? 1 : 0;
				return (
					bExact - aExact ||
					Math.abs(aName.length - requested.length) - Math.abs(bName.length - requested.length)
				);
			})[0] || null
	);
}

/**
 * @param {any} item
 * @param {JudgeProfileId} profileId
 * @param {'unavailable' | 'ambiguous'} status
 * @param {string} message
 * @returns {EnrichedItem}
 */
function missingItem(item, profileId, status, message) {
	return {
		itemId: cleanText(item.id),
		canonicalName: cleanText(item.name) || 'Unnamed item',
		domain: profileId,
		entityKind: profileId,
		status,
		confidence: status === 'ambiguous' ? 'low' : 'low',
		metadata: {},
		sources: [],
		message
	};
}

/**
 * @param {any} item
 * @param {JudgeProfileId} profileId
 * @param {any} page
 * @returns {EnrichedItem | null}
 */
function wikipediaItem(item, profileId, page) {
	if (!page || typeof page !== 'object' || !cleanText(page.extract)) return null;
	const pageUrl =
		cleanText(page.content_urls?.desktop?.page) ||
		`https://${page.lang || 'en'}.wikipedia.org/wiki/${encodeURIComponent(page.title || item.name)}`;

	return {
		itemId: cleanText(item.id),
		canonicalName: cleanText(page.title) || cleanText(item.name),
		domain: profileId,
		entityKind: profileId,
		status: 'fallback',
		confidence: 'low',
		metadata: {
			description: cleanText(page.extract),
			thumbnailUrl: cleanText(page.thumbnail?.source),
			language: cleanText(page.lang)
		},
		sources: [source('wikipedia', pageUrl, 'Wikipedia')],
		message: 'Specialized metadata was unavailable; this item uses a general reference fallback.'
	};
}

/**
 * @param {any} item
 * @param {JudgeProfileId} profileId
 * @param {string} language
 * @returns {Promise<EnrichedItem | null>}
 */
async function enrichFromWikipedia(item, profileId, language) {
	const lang = cleanText(language).slice(0, 2).toLowerCase() || 'en';
	const title = encodeURIComponent(cleanText(item.name));
	const page = await fetchJson(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`);
	return wikipediaItem(item, profileId, page);
}

/** @returns {Promise<string>} */
async function getIgdbToken() {
	const clientId = getEnv('IGDB_CLIENT_ID');
	const clientSecret = getEnv('IGDB_CLIENT_SECRET');
	if (!clientId || !clientSecret) {
		throw new ProviderUnavailableError(
			'igdb',
			'IGDB_CLIENT_ID and IGDB_CLIENT_SECRET are not configured.'
		);
	}
	if (cachedIgdbToken) return cachedIgdbToken;

	const response = await fetchJson(
		`https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
		{ method: 'POST' }
	);
	if (!cleanText(response?.access_token)) throw new Error('IGDB did not return an access token.');
	cachedIgdbToken = String(response.access_token);
	return cachedIgdbToken;
}

/**
 * @param {any} item
 * @returns {Promise<EnrichedItem | null>}
 */
async function enrichGame(item) {
	const clientId = getEnv('IGDB_CLIENT_ID');
	const token = await getIgdbToken();
	const escaped = cleanText(item.name).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	const games = await fetchJson('https://api.igdb.com/v4/games', {
		method: 'POST',
		headers: {
			'Client-ID': clientId,
			Authorization: `Bearer ${token}`,
			'Content-Type': 'text/plain'
		},
		body: `search "${escaped}"; fields name,summary,first_release_date,genres.name,platforms.name,developers.name,publishers.name,themes.name,game_modes.name,player_perspectives.name,websites.url; limit 5;`
	});
	const candidate = chooseCandidate(Array.isArray(games) ? games : [], item.name);
	if (!candidate) return null;

	const gameUrl = `https://www.igdb.com/games/${cleanText(candidate.slug) || encodeURIComponent(String(candidate.id))}`;
	return {
		itemId: cleanText(item.id),
		canonicalName: cleanText(String(candidate.name)) || cleanText(item.name),
		domain: 'games',
		entityKind: 'game',
		status: 'matched',
		confidence:
			normalizedName(String(candidate.name)) === normalizedName(item.name) ? 'high' : 'medium',
		metadata: {
			description: cleanText(candidate.summary),
			releaseYear: candidate.first_release_date
				? new Date(Number(candidate.first_release_date) * 1000).getUTCFullYear()
				: undefined,
			genres: Array.isArray(candidate.genres)
				? candidate.genres.map((value) => cleanText(value?.name)).filter(Boolean)
				: [],
			platforms: Array.isArray(candidate.platforms)
				? candidate.platforms.map((value) => cleanText(value?.name)).filter(Boolean)
				: [],
			developers: Array.isArray(candidate.developers)
				? candidate.developers.map((value) => cleanText(value?.name)).filter(Boolean)
				: [],
			publishers: Array.isArray(candidate.publishers)
				? candidate.publishers.map((value) => cleanText(value?.name)).filter(Boolean)
				: [],
			themes: Array.isArray(candidate.themes)
				? candidate.themes.map((value) => cleanText(value?.name)).filter(Boolean)
				: [],
			gameModes: Array.isArray(candidate.game_modes)
				? candidate.game_modes.map((value) => cleanText(value?.name)).filter(Boolean)
				: [],
			playerPerspectives: Array.isArray(candidate.player_perspectives)
				? candidate.player_perspectives.map((value) => cleanText(value?.name)).filter(Boolean)
				: []
		},
		sources: [source('igdb', gameUrl, 'IGDB')]
	};
}

/**
 * @param {any} item
 * @param {string} language
 * @returns {Promise<EnrichedItem | null>}
 */
async function enrichMovie(item, language) {
	const apiKey = getEnv('TMDB_API_KEY');
	if (!apiKey) throw new ProviderUnavailableError('tmdb', 'TMDB_API_KEY is not configured.');
	const lang = cleanText(language).replace('_', '-').slice(0, 5) || 'en-US';
	const url = new URL('https://api.themoviedb.org/3/search/multi');
	url.searchParams.set('api_key', apiKey);
	url.searchParams.set('query', cleanText(item.name));
	url.searchParams.set('language', lang);
	url.searchParams.set('include_adult', 'false');
	const response = await fetchJson(url.toString());
	const candidate = chooseCandidate(
		(Array.isArray(response?.results) ? response.results : []).filter(
			/** @param {any} value */ (value) =>
				value?.media_type === 'movie' || value?.media_type === 'tv'
		),
		item.name,
		titleKeyForTmdb
	);
	if (!candidate) return null;
	const mediaType = candidate.media_type === 'tv' ? 'tv' : 'movie';
	const title = cleanText(candidate.title || candidate.name) || cleanText(item.name);
	return {
		itemId: cleanText(item.id),
		canonicalName: title,
		domain: 'movies',
		entityKind: mediaType,
		status: 'matched',
		confidence: normalizedName(title) === normalizedName(item.name) ? 'high' : 'medium',
		metadata: {
			description: cleanText(candidate.overview),
			releaseYear: cleanText(candidate.release_date || candidate.first_air_date).slice(0, 4),
			originalLanguage: cleanText(candidate.original_language),
			popularity: typeof candidate.popularity === 'number' ? candidate.popularity : undefined,
			voteAverage: typeof candidate.vote_average === 'number' ? candidate.vote_average : undefined,
			genreIds: Array.isArray(candidate.genre_ids) ? candidate.genre_ids : []
		},
		sources: [source('tmdb', `https://www.themoviedb.org/${mediaType}/${candidate.id}`, 'TMDB')]
	};
}

/** @param {Record<string, unknown>} candidate */
function titleKeyForTmdb(candidate) {
	return String(candidate.title || candidate.name || '');
}

/**
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function fetchMusicBrainz(url, options = {}) {
	const waitMs = Math.max(0, musicBrainzNextAvailableAt - Date.now());
	if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
	try {
		return await fetchJson(url, {
			...options,
			headers: {
				Accept: 'application/json',
				'User-Agent':
					getEnv('MUSICBRAINZ_USER_AGENT') || 'ImagineATierList/1.0 (local taste profile)',
				...options.headers
			}
		});
	} finally {
		musicBrainzNextAvailableAt = Date.now() + 1000;
	}
}

/**
 * @param {any} item
 * @returns {Promise<EnrichedItem | null>}
 */
async function enrichMusic(item) {
	const query = encodeURIComponent(`"${cleanText(item.name)}"`);
	const releaseGroups = await fetchMusicBrainz(
		`https://musicbrainz.org/ws/2/release-group/?query=${query}&fmt=json&limit=5`
	);
	let candidate = chooseCandidate(
		Array.isArray(releaseGroups?.['release-groups']) ? releaseGroups['release-groups'] : [],
		item.name,
		'title'
	);
	let entityKind = 'album';
	if (!candidate) {
		const artists = await fetchMusicBrainz(
			`https://musicbrainz.org/ws/2/artist/?query=${query}&fmt=json&limit=5`
		);
		candidate = chooseCandidate(Array.isArray(artists?.artists) ? artists.artists : [], item.name);
		entityKind = 'artist';
	}
	if (!candidate) return null;

	const title = cleanText(String(candidate.title || candidate.name)) || cleanText(item.name);
	return {
		itemId: cleanText(item.id),
		canonicalName: title,
		domain: 'music',
		entityKind,
		status: 'matched',
		confidence: normalizedName(title) === normalizedName(item.name) ? 'high' : 'medium',
		metadata: {
			description: cleanText(candidate.disambiguation),
			firstReleaseDate: cleanText(candidate['first-release-date']),
			country: cleanText(candidate.country),
			genres: Array.isArray(candidate.tags)
				? candidate.tags.map((tag) => cleanText(tag?.name)).filter(Boolean)
				: [],
			artistCredits: Array.isArray(candidate['artist-credit'])
				? candidate['artist-credit']
						.map((credit) => cleanText(credit?.name || credit?.artist?.name))
						.filter(Boolean)
				: []
		},
		sources: [
			source(
				'musicbrainz',
				`https://musicbrainz.org/${entityKind === 'artist' ? 'artist' : 'release-group'}/${candidate.id}`,
				'MusicBrainz'
			)
		]
	};
}

/**
 * @param {any} item
 * @param {string} language
 * @returns {Promise<EnrichedItem | null>}
 */
async function enrichBook(item, language) {
	const url = new URL('https://www.googleapis.com/books/v1/volumes');
	url.searchParams.set('q', `intitle:${cleanText(item.name)}`);
	url.searchParams.set('maxResults', '5');
	url.searchParams.set('printType', 'books');
	const lang = cleanText(language).slice(0, 2);
	if (lang) url.searchParams.set('langRestrict', lang);
	const apiKey = getEnv('GOOGLE_BOOKS_API_KEY');
	if (apiKey) url.searchParams.set('key', apiKey);
	const response = await fetchJson(url.toString());
	const candidate = chooseCandidate(
		Array.isArray(response?.items) ? response.items : [],
		item.name,
		'title'
	);
	if (!candidate) return null;
	const info = /** @type {any} */ (candidate.volumeInfo || {});
	const title = cleanText(info.title) || cleanText(item.name);
	return {
		itemId: cleanText(item.id),
		canonicalName: title,
		domain: 'books',
		entityKind: 'book',
		status: 'matched',
		confidence: normalizedName(title) === normalizedName(item.name) ? 'high' : 'medium',
		metadata: {
			description: stripHtml(info.description),
			authors: Array.isArray(info.authors)
				? info.authors
						.map(/** @param {unknown} author */ (author) => cleanText(author))
						.filter(Boolean)
				: [],
			publisher: cleanText(info.publisher),
			publishedDate: cleanText(info.publishedDate),
			categories: Array.isArray(info.categories)
				? info.categories
						.map(/** @param {unknown} category */ (category) => cleanText(category))
						.filter(Boolean)
				: [],
			pageCount: typeof info.pageCount === 'number' ? info.pageCount : undefined,
			language: cleanText(info.language)
		},
		sources: [
			source(
				'google-books',
				cleanText(info.infoLink) || `https://books.google.com/books?id=${candidate.id}`,
				'Google Books'
			)
		]
	};
}

/** @type {Record<string, { provider: string; enrich: (...args: any[]) => Promise<EnrichedItem | null> }>} */
const ADAPTERS = {
	games: { provider: 'igdb', enrich: enrichGame },
	movies: { provider: 'tmdb', enrich: enrichMovie },
	music: { provider: 'musicbrainz', enrich: enrichMusic },
	books: { provider: 'google-books', enrich: enrichBook }
};

/**
 * @param {Map<string, { provider: string; status: string; matchedCount: number; failedCount: number; message?: string }>} report
 * @param {string} provider
 * @param {'matched' | 'failed' | 'unavailable'} status
 * @param {string} [message]
 */
function recordProvider(report, provider, status, message) {
	const current = report.get(provider) || {
		provider,
		status: 'ready',
		matchedCount: 0,
		failedCount: 0
	};
	if (status === 'matched') current.matchedCount += 1;
	else current.failedCount += 1;
	if (status === 'unavailable') current.status = 'unavailable';
	else if (current.status !== 'unavailable')
		current.status = status === 'failed' ? 'partial' : 'ready';
	if (message) current.message = message;
	report.set(provider, current);
}

/**
 * Enriches items sequentially so providers with strict rate limits remain safe.
 * @param {Array<{ id: string; name: string }>} items
 * @param {JudgeProfileId} profileId
 * @param {string} [language]
 * @returns {Promise<{ items: EnrichedItem[]; report: Array<{ provider: string; status: string; matchedCount: number; failedCount: number; message?: string }> }>}
 */
export async function enrichTasteItems(items, profileId, language = 'en') {
	const adapter = ADAPTERS[profileId];
	const report = new Map();
	/** @type {EnrichedItem[]} */
	const enrichedItems = [];

	for (const item of items) {
		let enriched = null;
		if (adapter) {
			try {
				enriched = await adapter.enrich(item, language);
				if (enriched) recordProvider(report, adapter.provider, 'matched');
				else recordProvider(report, adapter.provider, 'failed', 'No confident match was found.');
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Provider request failed.';
				const status = error instanceof ProviderUnavailableError ? 'unavailable' : 'failed';
				recordProvider(report, adapter.provider, status, message);
			}
		}

		if (!enriched) {
			try {
				enriched = await enrichFromWikipedia(item, profileId, language);
				if (enriched) recordProvider(report, 'wikipedia', 'matched');
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Fallback request failed.';
				recordProvider(report, 'wikipedia', 'failed', message);
			}
		}

		if (!enriched) {
			enriched = missingItem(
				item,
				profileId,
				adapter ? 'unavailable' : 'ambiguous',
				'No external metadata was available for this item.'
			);
		}
		enrichedItems.push(enriched);
	}

	return { items: enrichedItems, report: Array.from(report.values()) };
}

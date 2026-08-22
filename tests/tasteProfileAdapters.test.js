import { afterEach, describe, expect, it } from 'bun:test';
import { enrichTasteItems } from '../src/lib/server/tasteProfileAdapters.js';

const originalFetch = globalThis.fetch;
const originalEnv = new Map();

function setEnv(values) {
	for (const [key, value] of Object.entries(values)) {
		if (!originalEnv.has(key)) originalEnv.set(key, process.env[key]);
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
}

function response(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

afterEach(() => {
	globalThis.fetch = originalFetch;
	for (const [key, value] of originalEnv) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
	originalEnv.clear();
});

describe('taste profile metadata adapters', () => {
	it('normalizes an IGDB game response into evidence metadata', async () => {
		setEnv({ IGDB_CLIENT_ID: 'client', IGDB_CLIENT_SECRET: 'secret' });
		globalThis.fetch = async (input) => {
			const url = String(input);
			if (url.includes('id.twitch.tv')) return response({ access_token: 'token' });
			if (url.includes('api.igdb.com')) {
				return response([
					{
						id: 42,
						name: 'Example Game',
						slug: 'example-game',
						summary: 'A systems-heavy journey.',
						genres: [{ name: 'Role-playing' }],
						platforms: [{ name: 'PC' }]
					}
				]);
			}
			throw new Error(`unexpected request: ${url}`);
		};

		const result = await enrichTasteItems([{ id: 'item-1', name: 'Example Game' }], 'games');

		expect(result.items[0]).toMatchObject({
			itemId: 'item-1',
			canonicalName: 'Example Game',
			domain: 'games',
			entityKind: 'game',
			status: 'matched',
			confidence: 'high'
		});
		expect(result.items[0].metadata.genres).toEqual(['Role-playing']);
		expect(result.items[0].sources[0].provider).toBe('igdb');
	});

	it('normalizes TMDB, MusicBrainz, and Google Books responses', async () => {
		setEnv({ TMDB_API_KEY: 'tmdb-key', MUSICBRAINZ_USER_AGENT: 'test-agent' });
		globalThis.fetch = async (input) => {
			const url = String(input);
			if (url.includes('api.themoviedb.org')) {
				return response({
					results: [{ id: 7, media_type: 'movie', title: 'Example Film', overview: 'A film.' }]
				});
			}
			if (url.includes('musicbrainz.org')) {
				return response({
					'release-groups': [
						{ id: 'release-1', title: 'Example Album', disambiguation: 'Studio album' }
					]
				});
			}
			if (url.includes('googleapis.com/books')) {
				return response({
					items: [
						{
							id: 'book-1',
							volumeInfo: {
								title: 'Example Book',
								description: '<p>A book.</p>',
								authors: ['A. Writer']
							}
						}
					]
				});
			}
			throw new Error(`unexpected request: ${url}`);
		};

		const [movie, music, book] = await Promise.all([
			enrichTasteItems([{ id: 'movie-1', name: 'Example Film' }], 'movies'),
			enrichTasteItems([{ id: 'music-1', name: 'Example Album' }], 'music'),
			enrichTasteItems([{ id: 'book-1', name: 'Example Book' }], 'books')
		]);

		expect(movie.items[0]).toMatchObject({
			domain: 'movies',
			entityKind: 'movie',
			status: 'matched'
		});
		expect(music.items[0]).toMatchObject({
			domain: 'music',
			entityKind: 'album',
			status: 'matched'
		});
		expect(book.items[0]).toMatchObject({ domain: 'books', entityKind: 'book', status: 'matched' });
		expect(book.items[0].metadata.authors).toEqual(['A. Writer']);
	});

	it('keeps going with a visible fallback when a specialized provider is absent', async () => {
		setEnv({ IGDB_CLIENT_ID: undefined, IGDB_CLIENT_SECRET: undefined });
		globalThis.fetch = async (input) => {
			const url = String(input);
			if (url.includes('wikipedia.org')) {
				return response({
					title: 'Fallback Game',
					extract: 'A reference description.',
					lang: 'en'
				});
			}
			throw new Error(`unexpected request: ${url}`);
		};

		const result = await enrichTasteItems([{ id: 'item-1', name: 'Fallback Game' }], 'games', 'en');

		expect(result.items[0]).toMatchObject({
			status: 'fallback',
			confidence: 'low',
			domain: 'games'
		});
		expect(result.items[0].sources[0].provider).toBe('wikipedia');
		expect(
			result.report.some((entry) => entry.provider === 'igdb' && entry.status === 'unavailable')
		).toBe(true);
	});
});

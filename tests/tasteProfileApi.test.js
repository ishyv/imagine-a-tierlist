import { describe, expect, it } from 'bun:test';
import { POST as detect } from '../src/routes/api/ai/taste-profile/detect/+server.js';
import { POST as enrich } from '../src/routes/api/ai/taste-profile/enrich/+server.js';

function board(itemCount = 10) {
	return {
		id: 'board-api-test',
		title: 'Favorite Video Games',
		context: 'video games',
		tiers: [{ id: 'tier-s', label: 'S', order: 0 }],
		items: Array.from({ length: itemCount }, (_, index) => ({
			id: `item-${index}`,
			name: `Game ${index}`,
			tierId: 'tier-s',
			order: index
		}))
	};
}

function request(body) {
	return {
		request: new Request('http://localhost/api/ai/taste-profile', {
			method: 'POST',
			body: JSON.stringify(body)
		})
	};
}

describe('taste profile API contracts', () => {
	it('detects a specialized profile and returns all manual options', async () => {
		const response = await detect(request({ board: board(), language: 'en' }));
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.suggestedProfile).toBe('games');
		expect(data.profiles.map((profile) => profile.id)).toEqual([
			'games',
			'movies',
			'music',
			'books',
			'general'
		]);
		expect(data.eligibility.eligible).toBe(true);
	});

	it('returns a structured eligibility error before enrichment calls', async () => {
		const response = await enrich(request({ board: board(9), profileId: 'games' }));
		const data = await response.json();

		expect(response.status).toBe(422);
		expect(data.error).toMatchObject({
			code: 'TOO_FEW_ITEMS',
			message: 'Rank at least 10 items to create a grounded profile.'
		});
		expect(data.error.details.rankedCount).toBe(9);
	});

	it('rejects an unknown manual profile with a structured error', async () => {
		const response = await enrich(request({ board: board(), profileId: 'not-a-profile' }));
		const data = await response.json();

		expect(response.status).toBe(422);
		expect(data.error.code).toBe('UNKNOWN_JUDGE_PROFILE');
	});
});

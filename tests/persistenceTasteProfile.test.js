import { describe, expect, it } from 'bun:test';
import {
	CURRENT_VERSION,
	sanitizeBoard,
	sanitizeTasteProfileSnapshot
} from '../src/lib/services/persistence.js';

function snapshot() {
	return {
		boardFingerprint: 'taste-1234',
		generatedAt: '2026-08-21T00:00:00.000Z',
		judgeProfileId: 'games',
		judgeProfileVersion: 1,
		language: 'en',
		profile: { title: 'Systems with feeling', summary: 'A grounded reading.', confidence: 'high' },
		sections: [
			{
				id: 'section-1',
				title: 'Systems recur',
				thesis: 'Systems recur.',
				analysis: 'Two items support this.',
				evidenceItemIds: ['item-1'],
				counterEvidenceItemIds: [],
				confidence: 'high'
			}
		],
		mindset: [],
		tasteVector: [
			{
				id: 'systems',
				name: 'Systems',
				score: 8,
				confidence: 'high',
				summary: 'Repeated evidence.',
				evidenceItemIds: ['item-1'],
				counterEvidenceItemIds: []
			}
		],
		limitations: ['Not a diagnosis.'],
		closingSummary: 'A bounded summary.',
		enrichedItems: [
			{
				itemId: 'item-1',
				canonicalName: 'Example',
				domain: 'games',
				entityKind: 'game',
				status: 'matched',
				confidence: 'high',
				metadata: { genres: ['RPG'] },
				sources: [{ provider: 'igdb', url: 'https://example.com/item' }]
			}
		],
		enrichmentReport: []
	};
}

describe('taste profile persistence', () => {
	it('preserves a valid snapshot and upgrades the board schema', () => {
		const board = sanitizeBoard({
			id: 'board-1',
			title: 'Games',
			tiers: [{ id: 'tier-s', label: 'S', color: '#FFD000', order: 0 }],
			items: [{ id: 'item-1', name: 'Example', tierId: 'tier-s', order: 0 }],
			tasteProfile: snapshot(),
			version: 2
		});

		expect(board.version).toBe(CURRENT_VERSION);
		expect(board.tasteProfile.profile.title).toBe('Systems with feeling');
		expect(board.tasteProfile.enrichedItems[0].metadata.genres).toEqual(['RPG']);
	});

	it('drops malformed imported snapshots without dropping the board', () => {
		const board = sanitizeBoard({
			id: 'board-1',
			title: 'Games',
			tiers: [{ id: 'tier-s', label: 'S', color: '#FFD000', order: 0 }],
			items: [],
			tasteProfile: { boardFingerprint: 'bad', judgeProfileId: 'not-a-profile' }
		});

		expect(board).not.toBeNull();
		expect(board.tasteProfile).toBeUndefined();
		expect(sanitizeTasteProfileSnapshot(null)).toBeUndefined();
	});
});

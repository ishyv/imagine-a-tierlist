import { describe, expect, it } from 'bun:test';
import {
	MAX_TASTE_PROFILE_ITEMS,
	MIN_TASTE_PROFILE_ITEMS,
	createBoardFingerprint,
	getAnalysisEligibility,
	getTasteProfileStatus,
	validateTasteProfileOutput
} from '../src/lib/services/tasteProfile.js';

function createBoard(itemCount = 10) {
	return {
		id: 'board-test',
		title: 'Favorite Games',
		context: 'Video games',
		tiers: [
			{ id: 'tier-s', label: 'S', color: '#FFD000', order: 0 },
			{ id: 'tier-a', label: 'A', color: '#A335EE', order: 1 }
		],
		items: Array.from({ length: itemCount }, (_, index) => ({
			id: `item-${index}`,
			name: `Game ${index}`,
			imageUrl: `https://example.com/${index}.png`,
			sourceUrl: `https://example.com/${index}`,
			tierId: index % 2 === 0 ? 'tier-s' : 'tier-a',
			order: index
		})),
		version: 2
	};
}

describe('taste profile eligibility', () => {
	it('accepts a board with ten ranked items and reports the buffer separately', () => {
		const board = createBoard();
		board.items.push({
			id: 'unranked',
			name: 'Unranked game',
			imageUrl: '',
			tierId: null,
			order: 10
		});

		const result = getAnalysisEligibility(board);

		expect(result.eligible).toBe(true);
		expect(result.rankedCount).toBe(MIN_TASTE_PROFILE_ITEMS);
		expect(result.unrankedCount).toBe(1);
	});

	it('rejects fewer than ten ranked items', () => {
		const result = getAnalysisEligibility(createBoard(MIN_TASTE_PROFILE_ITEMS - 1));

		expect(result.eligible).toBe(false);
		expect(result.code).toBe('TOO_FEW_ITEMS');
	});

	it('rejects more than one hundred ranked items', () => {
		const result = getAnalysisEligibility(createBoard(MAX_TASTE_PROFILE_ITEMS + 1));

		expect(result.eligible).toBe(false);
		expect(result.code).toBe('TOO_MANY_ITEMS');
	});
});

describe('taste profile fingerprint', () => {
	it('ignores images, source URLs, and order within a tier', () => {
		const first = createBoard();
		const second = structuredClone(first);
		second.items.reverse();
		second.items.forEach((item, index) => {
			item.order = index + 100;
			item.imageUrl = `https://other.example/${index}.jpg`;
			item.sourceUrl = `https://other.example/${index}`;
		});

		expect(createBoardFingerprint(first)).toBe(createBoardFingerprint(second));
	});

	it('changes when a ranked item changes tier or the tier hierarchy changes', () => {
		const board = createBoard();
		const original = createBoardFingerprint(board);
		board.items[0].tierId = 'tier-a';

		expect(createBoardFingerprint(board)).not.toBe(original);

		board.items[0].tierId = 'tier-s';
		board.tiers[0].label = 'Loved';
		expect(createBoardFingerprint(board)).not.toBe(original);
	});
});

describe('taste profile snapshot status', () => {
	it('marks a stored snapshot stale when the board fingerprint changes', () => {
		const board = createBoard();
		board.tasteProfile = {
			boardFingerprint: createBoardFingerprint(board),
			generatedAt: '2026-08-21T00:00:00.000Z'
		};

		board.title = 'Changed title';
		const status = getTasteProfileStatus(board);

		expect(status.hasSnapshot).toBe(true);
		expect(status.isStale).toBe(true);
	});
});

function createValidProfile() {
	return {
		profile: {
			title: 'The Expressive Explorer',
			summary: 'A grounded summary.',
			confidence: 'high'
		},
		sections: [
			{
				id: 'movement',
				title: 'Movement keeps appearing',
				thesis: 'Movement is repeatedly rewarded.',
				analysis: 'The highest tier contains several movement-driven items.',
				evidenceItemIds: ['item-0', 'item-2'],
				counterEvidenceItemIds: ['item-1'],
				confidence: 'high'
			}
		],
		mindset: [
			{
				left: 'Expression',
				right: 'Optimization',
				leansToward: 'Expression',
				strength: 7,
				explanation: 'The list rewards expressive systems.',
				evidenceItemIds: ['item-0']
			}
		],
		tasteVector: [
			{
				id: 'movement',
				name: 'Movement as Gameplay',
				score: 9,
				confidence: 'high',
				summary: 'Movement appears central to enjoyment.',
				evidenceItemIds: ['item-0'],
				counterEvidenceItemIds: []
			}
		],
		limitations: ['This is an interpretation of this list, not a psychological measurement.'],
		closingSummary: 'The vector follows from the evidence above.'
	};
}

describe('taste profile output validation', () => {
	it('accepts a structured output whose claims cite known item IDs', () => {
		const result = validateTasteProfileOutput(createValidProfile(), ['item-0', 'item-1', 'item-2']);

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it('rejects unsupported evidence and out-of-range scores', () => {
		const output = createValidProfile();
		output.sections[0].evidenceItemIds = ['unknown-item'];
		output.tasteVector[0].score = 11;

		const result = validateTasteProfileOutput(output, ['item-0', 'item-1', 'item-2']);

		expect(result.valid).toBe(false);
		expect(result.errors.some((error) => error.includes('unknown item ID'))).toBe(true);
		expect(result.errors.some((error) => error.includes('score must be'))).toBe(true);
	});

	it('rejects diagnostic language even when the JSON shape is valid', () => {
		const output = createValidProfile();
		output.profile.summary = 'The user has an anxiety disorder.';

		const result = validateTasteProfileOutput(output, ['item-0', 'item-1', 'item-2']);

		expect(result.valid).toBe(false);
		expect(result.errors.some((error) => error.includes('diagnostic'))).toBe(true);
	});
});

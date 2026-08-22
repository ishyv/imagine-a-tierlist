import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { parseBoardImport, validateBoardImport } from '../src/lib/services/persistence.js';

// Bun runs this unit test without Svelte's rune transform. The import path is
// only used to verify the store's no-mutation boundary, so provide the minimal
// identity implementation needed by the store module.
globalThis.$state = (value) => value;
const { board } = await import('../src/lib/stores/board.svelte.js');

const fixture = JSON.parse(
	await readFile(new URL('./fixtures/league-of-legends-midlaners.json', import.meta.url), 'utf8')
);

function conceptualTasteProfilePayload() {
	return {
		title: 'Favorite League of Legends Midlaners',
		context: 'League of Legends mid lane champions',
		tiers: [
			{ name: 'S', rank: 1, items: [{ name: 'Azir' }] },
			{ name: 'A', rank: 2, items: [{ name: 'Orianna' }] }
		]
	};
}

describe('board import validation', () => {
	it('accepts the current flat board export format and the League fixture', () => {
		const result = validateBoardImport(fixture);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.board.title).toBe('League of Legends Midlaners');
		expect(result.board.tiers).toHaveLength(3);
		expect(result.board.items).toHaveLength(10);
		expect(result.board.items.every((item) => item.tierId)).toBe(true);
	});

	it('rejects conceptual nested tier data with an actionable format error', () => {
		const result = validateBoardImport(conceptualTasteProfilePayload());

		expect(result).toMatchObject({ ok: false, code: 'MISSING_ROOT_ITEMS' });
		expect(result.message).toContain('root `items`');
	});

	it('returns a structured error for invalid JSON', () => {
		const result = parseBoardImport('{not valid json');

		expect(result).toMatchObject({ ok: false, code: 'INVALID_JSON' });
		expect(result.message).toContain('valid JSON');
	});

	it('rejects duplicate IDs and references to missing tiers', () => {
		const duplicateTier = structuredClone(fixture);
		duplicateTier.tiers[1].id = duplicateTier.tiers[0].id;
		const missingTier = structuredClone(fixture);
		missingTier.items[0].tierId = 'tier-does-not-exist';

		expect(validateBoardImport(duplicateTier)).toMatchObject({
			ok: false,
			code: 'DUPLICATE_TIER_ID'
		});
		expect(validateBoardImport(missingTier)).toMatchObject({
			ok: false,
			code: 'UNKNOWN_TIER_ID'
		});
	});

	it('does not mutate the active board when import validation fails', () => {
		const before = {
			id: board.id,
			title: board.title,
			context: board.context,
			tiers: structuredClone(board.tiers),
			items: structuredClone(board.items)
		};

		board.id = 'board-before-invalid-import';
		board.title = 'Keep this board';
		board.context = 'Existing context';
		board.tiers = [{ id: 'tier-existing', label: 'S', color: '#FFD000', order: 0 }];
		board.items = [
			{
				id: 'item-existing',
				name: 'Existing card',
				imageUrl: '',
				tierId: 'tier-existing',
				order: 0
			}
		];

		const result = board.importJson(JSON.stringify(conceptualTasteProfilePayload()));

		expect(result).toMatchObject({ ok: false, code: 'MISSING_ROOT_ITEMS' });
		expect(board.id).toBe('board-before-invalid-import');
		expect(board.title).toBe('Keep this board');
		expect(board.context).toBe('Existing context');
		expect(board.tiers).toEqual([{ id: 'tier-existing', label: 'S', color: '#FFD000', order: 0 }]);
		expect(board.items).toEqual([
			{
				id: 'item-existing',
				name: 'Existing card',
				imageUrl: '',
				tierId: 'tier-existing',
				order: 0
			}
		]);

		board.id = before.id;
		board.title = before.title;
		board.context = before.context;
		board.tiers = before.tiers;
		board.items = before.items;
	});
});

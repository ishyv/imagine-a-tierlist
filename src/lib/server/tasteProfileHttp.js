import { getAnalysisEligibility, toAnalysisBoard } from '#lib/services/tasteProfile.js';

/**
 * @param {any} raw
 * @returns {any}
 */
export function normalizeRequestBoard(raw) {
	return toAnalysisBoard(raw && typeof raw === 'object' ? raw : {});
}

/**
 * @param {any} board
 * @returns {{ valid: boolean; code?: string; message?: string }}
 */
export function validateRequestBoard(board) {
	if (!board || typeof board !== 'object') {
		return { valid: false, code: 'BOARD_REQUIRED', message: 'A tier list board is required.' };
	}
	if (!Array.isArray(board.tiers) || board.tiers.length === 0) {
		return {
			valid: false,
			code: 'NO_TIERS',
			message: 'The tier list must contain at least one tier.'
		};
	}
	if (!Array.isArray(board.items)) {
		return {
			valid: false,
			code: 'ITEMS_REQUIRED',
			message: 'The tier list must contain an items array.'
		};
	}
	const ids = board.items.map(/** @param {{ id: string }} item */ (item) => item.id);
	if (new Set(ids).size !== ids.length || ids.some(/** @param {string} id */ (id) => !id)) {
		return {
			valid: false,
			code: 'DUPLICATE_ITEM_IDS',
			message: 'Every ranked item must have a unique ID.'
		};
	}
	return { valid: true };
}

/**
 * @param {any} rawItems
 * @param {string[]} itemIds
 * @returns {{ valid: boolean; code?: string; message?: string; items?: any[] }}
 */
export function validateEnrichedItems(rawItems, itemIds) {
	if (!Array.isArray(rawItems) || rawItems.length !== itemIds.length) {
		return {
			valid: false,
			code: 'ENRICHMENT_REQUIRED',
			message: 'Enriched metadata for every ranked item is required.'
		};
	}
	const allowedIds = new Set(itemIds);
	const seen = new Set();
	const items = [];

	for (const item of rawItems) {
		if (
			!item ||
			typeof item !== 'object' ||
			typeof item.itemId !== 'string' ||
			!allowedIds.has(item.itemId)
		) {
			return {
				valid: false,
				code: 'INVALID_ENRICHMENT',
				message: 'Enriched metadata contains an unknown item ID.'
			};
		}
		if (seen.has(item.itemId)) {
			return {
				valid: false,
				code: 'DUPLICATE_ENRICHMENT',
				message: 'Each ranked item may only have one enrichment result.'
			};
		}
		seen.add(item.itemId);
		const metadata = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
		const sources = Array.isArray(item.sources)
			? item.sources
					.filter(
						/** @param {any} value */ (value) =>
							value && typeof value.url === 'string' && /^https?:\/\//i.test(value.url)
					)
					.slice(0, 5)
					.map(
						/** @param {any} value */ (value) => ({
							provider:
								typeof value.provider === 'string' ? value.provider.slice(0, 40) : 'unknown',
							url: value.url.slice(0, 500),
							label: typeof value.label === 'string' ? value.label.slice(0, 80) : undefined
						})
					)
			: [];
		items.push({
			itemId: item.itemId,
			canonicalName: typeof item.canonicalName === 'string' ? item.canonicalName.slice(0, 200) : '',
			domain: typeof item.domain === 'string' ? item.domain.slice(0, 40) : 'general',
			entityKind: typeof item.entityKind === 'string' ? item.entityKind.slice(0, 40) : 'unknown',
			status: ['matched', 'ambiguous', 'unavailable', 'fallback'].includes(item.status)
				? item.status
				: 'unavailable',
			confidence: ['low', 'medium', 'high', 'very_high'].includes(item.confidence)
				? item.confidence
				: 'low',
			metadata,
			sources,
			message: typeof item.message === 'string' ? item.message.slice(0, 500) : undefined
		});
	}

	return seen.size === itemIds.length
		? { valid: true, items }
		: {
				valid: false,
				code: 'INCOMPLETE_ENRICHMENT',
				message: 'An enrichment result is missing for one or more ranked items.'
			};
}

/**
 * @param {any} board
 * @returns {ReturnType<typeof getAnalysisEligibility>}
 */
export function getRequestEligibility(board) {
	return getAnalysisEligibility(board);
}

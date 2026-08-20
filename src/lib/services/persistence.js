/**
 * Persistence service for single-board auto-save and multi-board registry
 * @typedef {import('#lib/types.js').Board} Board
 */

export const STORAGE_KEY = 'tierlist-board-v1';
export const BOARDS_REGISTRY_KEY = 'tierlist-boards-registry-v1';
export const CURRENT_VERSION = 1;

/**
 * @typedef {Object} BoardSummary
 * @property {string} id
 * @property {string} title
 * @property {string} [context]
 * @property {number} cardCount
 * @property {number} tierCount
 * @property {number} updatedAt
 */

/**
 * Validates and sanitizes raw board data
 * @param {any} raw
 * @returns {Board | null}
 */
export function sanitizeBoard(raw) {
	if (!raw || typeof raw !== 'object') return null;

	const validTiers = Array.isArray(raw.tiers)
		? raw.tiers
				.filter(/** @param {any} t */ (t) => t && typeof t === 'object' && typeof t.id === 'string')
				.map(
					/** @param {any} t @param {number} idx */ (t, idx) => ({
						id: String(t.id),
						label: String(t.label || 'Tier').slice(0, 30),
						color: String(t.color || '#3b82f6'),
						order: typeof t.order === 'number' ? t.order : idx,
						imageUrl: t.imageUrl ? String(t.imageUrl).trim() : undefined
					})
				)
		: [];

	const validItems = Array.isArray(raw.items)
		? raw.items
				.filter(/** @param {any} i */ (i) => i && typeof i === 'object' && typeof i.id === 'string')
				.map(
					/** @param {any} i @param {number} idx */ (i, idx) => ({
						id: String(i.id),
						name: String(i.name || 'Unnamed').slice(0, 100),
						imageUrl: String(i.imageUrl || '').trim(),
						sourceUrl: i.sourceUrl ? String(i.sourceUrl).trim() : undefined,
						tierId: i.tierId ? String(i.tierId) : null,
						order: typeof i.order === 'number' ? i.order : idx
					})
				)
		: [];

	return {
		id: typeof raw.id === 'string' && raw.id ? raw.id : `board-${Date.now()}`,
		title: typeof raw.title === 'string' ? raw.title : 'Tier List',
		context: typeof raw.context === 'string' ? raw.context : '',
		tiers: validTiers,
		items: validItems,
		version: typeof raw.version === 'number' ? raw.version : CURRENT_VERSION
	};
}

/**
 * Loads the active board from localStorage
 * @returns {Board | null}
 */
export function loadBoardFromStorage() {
	if (typeof window === 'undefined') return null;

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		return sanitizeBoard(parsed);
	} catch (e) {
		console.warn('Failed to load tier list board from localStorage:', e);
	}
	return null;
}

/**
 * Saves active board to localStorage and syncs with registry
 * @param {Board} board
 */
export function saveBoardToStorage(board) {
	if (typeof window === 'undefined' || !board) return;

	try {
		const sanitized = sanitizeBoard(board);
		if (!sanitized) return;

		localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));

		// Also save in multi-board registry
		saveBoardToRegistry(sanitized);
	} catch (e) {
		console.warn('Failed to save tier list board to localStorage (possibly quota exceeded):', e);
	}
}

/**
 * Clears active board from localStorage
 */
export function clearBoardStorage() {
	if (typeof window === 'undefined') return;

	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		console.warn('Failed to clear board from localStorage:', e);
	}
}

/**
 * Loads the list of all saved boards from the registry
 * @returns {BoardSummary[]}
 */
export function getBoardsRegistry() {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(BOARDS_REGISTRY_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((b) => b && typeof b === 'object' && typeof b.id === 'string')
			: [];
	} catch (e) {
		console.warn('Failed to load boards registry:', e);
		return [];
	}
}

/**
 * Saves or updates a board in the multi-board registry
 * @param {Board} board
 */
export function saveBoardToRegistry(board) {
	if (typeof window === 'undefined' || !board || !board.id) return;
	try {
		const sanitized = sanitizeBoard(board);
		if (!sanitized) return;

		// Save full board data under board-specific key
		localStorage.setItem(`tierlist-board-${sanitized.id}`, JSON.stringify(sanitized));

		// Update registry index
		const registry = getBoardsRegistry();
		const existingIndex = registry.findIndex((b) => b.id === sanitized.id);

		const summary = {
			id: sanitized.id,
			title: sanitized.title || 'Untitled Board',
			context: sanitized.context || '',
			cardCount: sanitized.items.length,
			tierCount: sanitized.tiers.length,
			updatedAt: Date.now()
		};

		if (existingIndex >= 0) {
			registry[existingIndex] = summary;
		} else {
			registry.unshift(summary);
		}

		// Cap registry to max 40 boards to protect storage quota
		const cappedRegistry = registry.slice(0, 40);
		localStorage.setItem(BOARDS_REGISTRY_KEY, JSON.stringify(cappedRegistry));
	} catch (e) {
		console.warn('Failed to save board to registry:', e);
	}
}

/**
 * Loads a specific board by its ID
 * @param {string} boardId
 * @returns {Board | null}
 */
export function loadBoardById(boardId) {
	if (typeof window === 'undefined' || !boardId) return null;
	try {
		const raw = localStorage.getItem(`tierlist-board-${boardId}`);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return sanitizeBoard(parsed);
	} catch (e) {
		console.warn(`Failed to load board ${boardId}:`, e);
	}
	return null;
}

/**
 * Deletes a board from the registry and storage
 * @param {string} boardId
 */
export function deleteBoardFromRegistry(boardId) {
	if (typeof window === 'undefined' || !boardId) return;
	try {
		localStorage.removeItem(`tierlist-board-${boardId}`);
		const registry = getBoardsRegistry().filter((b) => b.id !== boardId);
		localStorage.setItem(BOARDS_REGISTRY_KEY, JSON.stringify(registry));
	} catch (e) {
		console.warn(`Failed to delete board ${boardId}:`, e);
	}
}

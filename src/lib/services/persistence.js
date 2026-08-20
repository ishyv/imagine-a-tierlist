/**
 * @typedef {import('#lib/types.js').Board} Board
 */

export const STORAGE_KEY = 'tierlist-board-v1';
export const CURRENT_VERSION = 1;

/**
 * Loads board from localStorage
 * @returns {Board | null}
 */
export function loadBoardFromStorage() {
	if (typeof window === 'undefined') return null;

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		if (
			parsed &&
			typeof parsed === 'object' &&
			Array.isArray(parsed.tiers) &&
			Array.isArray(parsed.items)
		) {
			return parsed;
		}
	} catch (e) {
		console.warn('Failed to load tier list board from localStorage:', e);
	}
	return null;
}

/**
 * Saves board to localStorage
 * @param {Board} board
 */
export function saveBoardToStorage(board) {
	if (typeof window === 'undefined') return;

	try {
		const data = {
			...board,
			version: CURRENT_VERSION
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.warn('Failed to save tier list board to localStorage:', e);
	}
}

/**
 * Clears board from localStorage
 */
export function clearBoardStorage() {
	if (typeof window === 'undefined') return;

	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (e) {
		console.warn('Failed to clear board from localStorage:', e);
	}
}

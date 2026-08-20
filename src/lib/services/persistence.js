/**
 * Persistence service for single-board auto-save and multi-board registry
 * @typedef {import('#lib/types.js').Board} Board
 */

export const STORAGE_KEY = 'tierlist-board-v2';
export const LEGACY_STORAGE_KEY = 'tierlist-board-v1';
export const BOARDS_REGISTRY_KEY = 'tierlist-boards-registry-v2';
export const LEGACY_BOARDS_REGISTRY_KEY = 'tierlist-boards-registry-v1';
export const CURRENT_VERSION = 2;

/**
 * Standard gaming prestige color mapping
 */
export const PRESTIGE_TIER_COLORS = {
	s: '#FFD000',
	a: '#A335EE',
	b: '#0070DD',
	c: '#1EFF00',
	d: '#CD7F32',
	f: '#808080'
};

/**
 * Legacy to Prestige color migration map
 */
export const LEGACY_COLOR_MIGRATION = {
	'#b64a38': '#FFD000',
	'#ef4444': '#FFD000',
	'#f87171': '#FFD000',
	'#f59e0b': '#FFD000',
	'#c77728': '#A335EE',
	'#f97316': '#A335EE',
	'#fb923c': '#A335EE',
	'#a855f7': '#A335EE',
	'#8b5cf6': '#A335EE',
	'#c79c57': '#0070DD',
	'#eab308': '#0070DD',
	'#facc15': '#0070DD',
	'#3b82f6': '#0070DD',
	'#60a5fa': '#0070DD',
	'#738f61': '#1EFF00',
	'#22c55e': '#1EFF00',
	'#4ade80': '#1EFF00',
	'#10b981': '#1EFF00',
	'#4a7c87': '#CD7F32',
	'#b45309': '#CD7F32',
	'#59616d': '#808080',
	'#94a3b8': '#808080',
	'#475569': '#808080'
};

/**
 * Migrates a tier color to the modern gaming prestige progression
 * @param {string} label
 * @param {string} color
 * @returns {string}
 */
export function normalizeTierColor(label, color) {
	if (color && typeof color === 'string' && color.trim()) {
		return color.trim();
	}

	const normalizedLabel = (label || '').trim().toLowerCase();
	if (normalizedLabel in PRESTIGE_TIER_COLORS) {
		return PRESTIGE_TIER_COLORS[/** @type {keyof typeof PRESTIGE_TIER_COLORS} */ (normalizedLabel)];
	}

	return '#FFD000';
}

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
 * Validates, sanitizes, and upgrades raw board data
 * @param {any} raw
 * @returns {Board | null}
 */
export function sanitizeBoard(raw) {
	if (!raw || typeof raw !== 'object') return null;

	const validTiers = Array.isArray(raw.tiers)
		? raw.tiers
				.filter(/** @param {any} t */ (t) => t && typeof t === 'object' && typeof t.id === 'string')
				.map(
					/** @param {any} t @param {number} idx */ (t, idx) => {
						const label = String(t.label || 'Tier').slice(0, 30);
						const initialColor = String(t.color || '#0070DD');
						const migratedColor = normalizeTierColor(label, initialColor);

						return {
							id: String(t.id),
							label,
							color: migratedColor,
							order: typeof t.order === 'number' ? t.order : idx,
							imageUrl: t.imageUrl ? String(t.imageUrl).trim() : undefined
						};
					}
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
		version: CURRENT_VERSION
	};
}

/**
 * Loads the active board from localStorage (with v1 fallback migration)
 * @returns {Board | null}
 */
export function loadBoardFromStorage() {
	if (typeof window === 'undefined') return null;

	try {
		let raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			// Check legacy key for existing user data
			raw = localStorage.getItem(LEGACY_STORAGE_KEY);
		}

		if (!raw) return null;

		const parsed = JSON.parse(raw);
		const sanitized = sanitizeBoard(parsed);

		if (sanitized) {
			// Write upgraded structure to v2 key
			localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
		}

		return sanitized;
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
		console.warn('Failed to save tier list board to localStorage:', e);
	}
}

/**
 * Retrieves the registry list of all saved boards
 * @returns {BoardSummary[]}
 */
export function getBoardsRegistry() {
	if (typeof window === 'undefined') return [];

	try {
		let raw = localStorage.getItem(BOARDS_REGISTRY_KEY);
		if (!raw) {
			raw = localStorage.getItem(LEGACY_BOARDS_REGISTRY_KEY);
		}

		if (!raw) return [];

		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(
			(b) => b && typeof b === 'object' && typeof b.id === 'string' && typeof b.title === 'string'
		);
	} catch (e) {
		console.warn('Failed to get boards registry:', e);
		return [];
	}
}

/**
 * Saves or updates a board in the global multi-board registry
 * @param {Board} board
 */
export function saveBoardToRegistry(board) {
	if (typeof window === 'undefined' || !board) return;

	try {
		const registry = getBoardsRegistry();
		const summary = {
			id: board.id,
			title: board.title,
			context: board.context,
			cardCount: board.items.length,
			tierCount: board.tiers.length,
			updatedAt: Date.now()
		};

		const existingIdx = registry.findIndex((b) => b.id === board.id);
		if (existingIdx >= 0) {
			registry[existingIdx] = summary;
		} else {
			registry.unshift(summary);
		}

		localStorage.setItem(BOARDS_REGISTRY_KEY, JSON.stringify(registry));
		localStorage.setItem(`board-data-${board.id}`, JSON.stringify(board));
	} catch (e) {
		console.warn('Failed to save board to registry:', e);
	}
}

/**
 * Loads a full board by its unique ID
 * @param {string} boardId
 * @returns {Board | null}
 */
export function loadBoardById(boardId) {
	if (typeof window === 'undefined' || !boardId) return null;

	try {
		const raw = localStorage.getItem(`board-data-${boardId}`);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		return sanitizeBoard(parsed);
	} catch (e) {
		console.warn(`Failed to load board ${boardId}:`, e);
		return null;
	}
}

/**
 * Deletes a board from the saved registry and its storage
 * @param {string} boardId
 */
export function deleteBoardFromRegistry(boardId) {
	if (typeof window === 'undefined' || !boardId) return;

	try {
		const registry = getBoardsRegistry().filter((b) => b.id !== boardId);
		localStorage.setItem(BOARDS_REGISTRY_KEY, JSON.stringify(registry));
		localStorage.removeItem(`board-data-${boardId}`);
	} catch (e) {
		console.warn(`Failed to delete board ${boardId}:`, e);
	}
}

/**
 * Persistence service for single-board auto-save and multi-board registry
 * @typedef {import('#lib/types.js').Board} Board
 */

export const STORAGE_KEY = 'tierlist-board-v2';
export const LEGACY_STORAGE_KEY = 'tierlist-board-v1';
export const BOARDS_REGISTRY_KEY = 'tierlist-boards-registry-v2';
export const LEGACY_BOARDS_REGISTRY_KEY = 'tierlist-boards-registry-v1';
export const CURRENT_VERSION = 3;

const TASTE_PROFILE_IDS = new Set(['games', 'movies', 'music', 'books', 'general']);
const TASTE_PROFILE_CONFIDENCE = new Set(['low', 'medium', 'high', 'very_high']);
const TASTE_PROFILE_STATUS = new Set(['matched', 'ambiguous', 'unavailable', 'fallback']);

/**
 * Keeps imported/local snapshots bounded and structurally safe without coupling
 * browser persistence to the server-side model validator.
 * @param {unknown} value
 * @param {number} max
 * @returns {string}
 */
function boundedText(value, max) {
	return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function stringList(value) {
	return Array.isArray(value)
		? value
				.filter((entry) => typeof entry === 'string')
				.map((entry) => entry.slice(0, 120))
				.slice(0, 24)
		: [];
}

/**
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
function safeMetadata(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return Object.fromEntries(
		Object.entries(value)
			.slice(0, 32)
			.map(([key, entry]) => {
				if (typeof entry === 'string') return [key.slice(0, 80), entry.slice(0, 1000)];
				if (typeof entry === 'number' || typeof entry === 'boolean')
					return [key.slice(0, 80), entry];
				if (Array.isArray(entry)) {
					return [
						key.slice(0, 80),
						entry
							.filter((item) => typeof item === 'string')
							.map((item) => item.slice(0, 160))
							.slice(0, 24)
					];
				}
				return [key.slice(0, 80), undefined];
			})
			.filter(([, entry]) => typeof entry !== 'undefined')
	);
}

/**
 * Sanitizes a generated taste profile snapshot before it enters localStorage.
 * Invalid snapshots are discarded rather than allowed to break board loading.
 * @param {any} raw
 * @returns {import('#lib/types.js').TasteProfileSnapshot | undefined}
 */
export function sanitizeTasteProfileSnapshot(raw) {
	if (!raw || typeof raw !== 'object') return undefined;
	const boardFingerprint = boundedText(raw.boardFingerprint, 100);
	const generatedAt = boundedText(raw.generatedAt, 80);
	if (
		!boardFingerprint ||
		!generatedAt ||
		!TASTE_PROFILE_IDS.has(raw.judgeProfileId) ||
		typeof raw.judgeProfileVersion !== 'number' ||
		!Number.isFinite(raw.judgeProfileVersion) ||
		typeof raw.language !== 'string'
	) {
		return undefined;
	}

	const profile = raw.profile;
	if (
		!profile ||
		typeof profile !== 'object' ||
		!boundedText(profile.title, 180) ||
		!boundedText(profile.summary, 1200) ||
		!TASTE_PROFILE_CONFIDENCE.has(profile.confidence)
	) {
		return undefined;
	}

	/** @param {any} value */
	const sources = (value) =>
		Array.isArray(value)
			? value
					.filter(
						(source) =>
							source &&
							typeof source === 'object' &&
							typeof source.url === 'string' &&
							/^https?:\/\//i.test(source.url)
					)
					.map((source) => ({
						provider: boundedText(source.provider, 80) || 'unknown',
						url: boundedText(source.url, 500),
						...(boundedText(source.label, 160) ? { label: boundedText(source.label, 160) } : {})
					}))
					.filter((source) => source.url)
					.slice(0, 12)
			: [];

	const enrichedItems = Array.isArray(raw.enrichedItems)
		? raw.enrichedItems
				.filter(
					/** @param {any} item */
					(item) =>
						item &&
						typeof item === 'object' &&
						typeof item.itemId === 'string' &&
						typeof item.canonicalName === 'string' &&
						typeof item.domain === 'string' &&
						typeof item.entityKind === 'string' &&
						TASTE_PROFILE_STATUS.has(item.status) &&
						TASTE_PROFILE_CONFIDENCE.has(item.confidence)
				)
				.map(
					/** @param {any} item */
					(item) => ({
						itemId: boundedText(item.itemId, 120),
						canonicalName: boundedText(item.canonicalName, 180),
						domain: boundedText(item.domain, 40),
						entityKind: boundedText(item.entityKind, 60),
						status: item.status,
						confidence: item.confidence,
						metadata: safeMetadata(item.metadata),
						sources: sources(item.sources),
						...(boundedText(item.message, 300) ? { message: boundedText(item.message, 300) } : {})
					})
				)
				.filter(
					/** @param {any} item */
					(item) => item.itemId && item.canonicalName
				)
				.slice(0, 100)
		: [];

	const sections = Array.isArray(raw.sections)
		? raw.sections
				.filter(
					/** @param {any} section */
					(section) => section && typeof section === 'object'
				)
				.map(
					/** @param {any} section */
					(section) => ({
						id: boundedText(section.id, 80),
						title: boundedText(section.title, 180),
						thesis: boundedText(section.thesis, 700),
						analysis: boundedText(section.analysis, 1800),
						evidenceItemIds: stringList(section.evidenceItemIds),
						counterEvidenceItemIds: stringList(section.counterEvidenceItemIds),
						confidence: section.confidence
					})
				)
				.filter(
					/** @param {any} section */
					(section) =>
						section.id &&
						section.title &&
						section.thesis &&
						section.analysis &&
						TASTE_PROFILE_CONFIDENCE.has(section.confidence)
				)
				.slice(0, 8)
		: [];

	const mindset = Array.isArray(raw.mindset)
		? raw.mindset
				.filter(
					/** @param {any} entry */
					(entry) => entry && typeof entry === 'object'
				)
				.map(
					/** @param {any} entry */
					(entry) => ({
						left: boundedText(entry.left, 120),
						right: boundedText(entry.right, 120),
						leansToward: boundedText(entry.leansToward, 120),
						strength:
							typeof entry.strength === 'number' ? Math.max(0, Math.min(10, entry.strength)) : 0,
						explanation: boundedText(entry.explanation, 900),
						evidenceItemIds: stringList(entry.evidenceItemIds)
					})
				)
				.filter(
					/** @param {any} entry */
					(entry) => entry.left && entry.right && entry.explanation && entry.evidenceItemIds.length
				)
				.slice(0, 8)
		: [];

	const tasteVector = Array.isArray(raw.tasteVector)
		? raw.tasteVector
				.filter(
					/** @param {any} dimension */
					(dimension) => dimension && typeof dimension === 'object'
				)
				.map(
					/** @param {any} dimension */
					(dimension) => ({
						id: boundedText(dimension.id, 80),
						name: boundedText(dimension.name, 120),
						score:
							typeof dimension.score === 'number'
								? Math.max(0, Math.min(10, Math.round(dimension.score)))
								: 0,
						confidence: dimension.confidence,
						summary: boundedText(dimension.summary, 500),
						evidenceItemIds: stringList(dimension.evidenceItemIds),
						counterEvidenceItemIds: stringList(dimension.counterEvidenceItemIds)
					})
				)
				.filter(
					/** @param {any} dimension */
					(dimension) =>
						dimension.id &&
						dimension.name &&
						dimension.summary &&
						TASTE_PROFILE_CONFIDENCE.has(dimension.confidence) &&
						dimension.evidenceItemIds.length
				)
				.slice(0, 12)
		: [];

	const enrichmentReport = Array.isArray(raw.enrichmentReport)
		? raw.enrichmentReport
				.filter(
					/** @param {any} entry */
					(entry) => entry && typeof entry === 'object'
				)
				.map(
					/** @param {any} entry */
					(entry) => ({
						provider: boundedText(entry.provider, 80),
						status: boundedText(entry.status, 80),
						matchedCount:
							typeof entry.matchedCount === 'number' ? Math.max(0, entry.matchedCount) : 0,
						failedCount: typeof entry.failedCount === 'number' ? Math.max(0, entry.failedCount) : 0,
						...(boundedText(entry.message, 300) ? { message: boundedText(entry.message, 300) } : {})
					})
				)
				.filter(
					/** @param {any} entry */
					(entry) => entry.provider
				)
				.slice(0, 12)
		: [];

	return {
		boardFingerprint,
		generatedAt,
		judgeProfileId: raw.judgeProfileId,
		judgeProfileVersion: Math.max(1, Math.floor(raw.judgeProfileVersion)),
		language: boundedText(raw.language, 12) || 'en',
		profile: {
			title: boundedText(profile.title, 180),
			summary: boundedText(profile.summary, 1200),
			confidence: profile.confidence
		},
		sections,
		mindset,
		tasteVector,
		limitations: stringList(raw.limitations),
		closingSummary: boundedText(raw.closingSummary, 1200),
		enrichedItems,
		enrichmentReport
	};
}

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
	const tasteProfile = sanitizeTasteProfileSnapshot(raw.tasteProfile);

	return {
		id: typeof raw.id === 'string' && raw.id ? raw.id : `board-${Date.now()}`,
		title: typeof raw.title === 'string' ? raw.title : 'Tier List',
		context: typeof raw.context === 'string' ? raw.context : '',
		tiers: validTiers,
		items: validItems,
		version: CURRENT_VERSION,
		...(tasteProfile ? { tasteProfile } : {})
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

/**
 * Shared rules for preparing, fingerprinting, and rendering Taste Profiles.
 * This module intentionally has no browser or server dependencies.
 */

export const MIN_TASTE_PROFILE_ITEMS = 10;
export const MAX_TASTE_PROFILE_ITEMS = 100;

/**
 * @typedef {'TOO_FEW_ITEMS' | 'TOO_MANY_ITEMS' | 'NO_TIERS' | 'READY'} EligibilityCode
 */

/**
 * @typedef {Object} AnalysisEligibility
 * @property {boolean} eligible
 * @property {EligibilityCode} code
 * @property {string} message
 * @property {number} rankedCount
 * @property {number} unrankedCount
 * @property {number} orphanedCount
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
function text(value) {
	return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function numberOrZero(value) {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * @param {any} board
 * @returns {Array<Record<string, any>>}
 */
function getBoardTiers(board) {
	return Array.isArray(board?.tiers) ? board.tiers : [];
}

/**
 * @param {any} board
 * @returns {Array<Record<string, any>>}
 */
function getBoardItems(board) {
	return Array.isArray(board?.items) ? board.items : [];
}

/**
 * @param {any} board
 * @returns {any[]}
 */
export function getRankedItems(board) {
	const tierIds = new Set(getBoardTiers(board).map((tier) => tier?.id));
	return getBoardItems(board).filter(
		(item) => item && text(item.tierId) && tierIds.has(item.tierId)
	);
}

/**
 * @param {any} board
 * @returns {AnalysisEligibility}
 */
export function getAnalysisEligibility(board) {
	const tiers = getBoardTiers(board);
	const items = getBoardItems(board);
	const tierIds = new Set(tiers.map((tier) => tier?.id).filter(Boolean));
	const rankedItems = items.filter((item) => item && text(item.tierId) && tierIds.has(item.tierId));
	const orphanedCount = items.filter(
		(item) => item && text(item.tierId) && !tierIds.has(item.tierId)
	).length;
	const unrankedCount = items.length - rankedItems.length - orphanedCount;

	if (tiers.length === 0) {
		return {
			eligible: false,
			code: 'NO_TIERS',
			message: 'Create at least one tier before analyzing this list.',
			rankedCount: rankedItems.length,
			unrankedCount,
			orphanedCount
		};
	}

	if (rankedItems.length < MIN_TASTE_PROFILE_ITEMS) {
		return {
			eligible: false,
			code: 'TOO_FEW_ITEMS',
			message: `Rank at least ${MIN_TASTE_PROFILE_ITEMS} items to create a grounded profile.`,
			rankedCount: rankedItems.length,
			unrankedCount,
			orphanedCount
		};
	}

	if (rankedItems.length > MAX_TASTE_PROFILE_ITEMS) {
		return {
			eligible: false,
			code: 'TOO_MANY_ITEMS',
			message: `Taste Profiles support up to ${MAX_TASTE_PROFILE_ITEMS} ranked items.`,
			rankedCount: rankedItems.length,
			unrankedCount,
			orphanedCount
		};
	}

	return {
		eligible: true,
		code: 'READY',
		message: 'This list has enough ranked evidence for analysis.',
		rankedCount: rankedItems.length,
		unrankedCount,
		orphanedCount
	};
}

/**
 * Stable FNV-1a hash. The fingerprint is for local invalidation, not security.
 * @param {string} value
 * @returns {string}
 */
function hashFingerprint(value) {
	let hash = 0x811c9dc5;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Builds a fingerprint from information that changes the meaning of a profile.
 * Images, source URLs, and within-tier order are intentionally excluded.
 * @param {any} board
 * @returns {string}
 */
export function createBoardFingerprint(board) {
	const tiers = getBoardTiers(board)
		.slice()
		.sort((a, b) => numberOrZero(a?.order) - numberOrZero(b?.order))
		.map((tier) => ({
			id: text(tier?.id),
			label: text(tier?.label),
			order: numberOrZero(tier?.order)
		}));
	const tierOrder = new Map(tiers.map((tier, index) => [tier.id, index]));
	const items = getRankedItems(board)
		.slice()
		.sort((a, b) => {
			const tierDifference = (tierOrder.get(a.tierId) ?? 0) - (tierOrder.get(b.tierId) ?? 0);
			return tierDifference || text(a.id).localeCompare(text(b.id));
		})
		.map((item) => ({
			id: text(item.id),
			name: text(item.name),
			tierId: text(item.tierId)
		}));

	const payload = JSON.stringify({
		title: text(board?.title),
		context: text(board?.context),
		tiers,
		items
	});

	return `taste-${hashFingerprint(payload)}`;
}

/**
 * @param {any} board
 * @returns {{ hasSnapshot: boolean; isStale: boolean; fingerprint: string; snapshot: any }}
 */
export function getTasteProfileStatus(board) {
	const snapshot = board?.tasteProfile || null;
	const fingerprint = createBoardFingerprint(board);

	return {
		hasSnapshot: Boolean(snapshot),
		isStale: Boolean(snapshot && snapshot.boardFingerprint !== fingerprint),
		fingerprint,
		snapshot
	};
}

/**
 * @param {any} board
 * @returns {any}
 */
export function toAnalysisBoard(board) {
	const tiers = getBoardTiers(board)
		.slice()
		.sort((a, b) => numberOrZero(a?.order) - numberOrZero(b?.order))
		.map((tier, index) => ({
			id: text(tier?.id),
			label: text(tier?.label) || `Tier ${index + 1}`,
			order: index
		}));
	const tierIds = new Set(tiers.map((tier) => tier.id));
	const items = getBoardItems(board)
		.filter((item) => item && tierIds.has(text(item.tierId)))
		.map((item) => ({
			id: text(item.id),
			name: text(item.name) || 'Unnamed item',
			tierId: text(item.tierId),
			imageUrl: text(item.imageUrl),
			sourceUrl: text(item.sourceUrl) || undefined
		}));

	return {
		id: text(board?.id),
		title: text(board?.title) || 'Tier List',
		context: text(board?.context),
		tiers,
		items,
		unrankedCount: getBoardItems(board).filter((item) => item && !text(item.tierId)).length
	};
}

const CONFIDENCE_LEVELS = new Set(['low', 'medium', 'high', 'very_high']);

/**
 * Validates the model-owned portion of a Taste Profile before it is persisted
 * or rendered. Every substantive claim must point back to a board item.
 * @param {any} output
 * @param {string[]} itemIds
 * @returns {{ valid: boolean; errors: string[] }}
 */
export function validateTasteProfileOutput(output, itemIds) {
	const errors = [];
	const validItemIds = new Set(itemIds);
	/** @param {unknown} value */
	const isText = (value) => typeof value === 'string' && value.trim().length > 0;
	/** @param {unknown} value */
	const isConfidence = (value) => typeof value === 'string' && CONFIDENCE_LEVELS.has(value);
	/** @param {unknown} value */
	const isScore = (value) =>
		typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 10;
	/** @param {unknown} value */
	const hasDiagnosticClaim = (value) => {
		if (typeof value !== 'string' || !value.trim()) return false;
		const normalized = value.toLowerCase();
		const disclaimer =
			/\b(?:not|never|without|no)\s+(?:a\s+)?(?:clinical\s+)?diagnos(?:e|is|tic|ed)\b/i.test(
				normalized
			);
		const diagnostic =
			/\b(?:diagnos(?:e|is|tic|ed)|clinical|adhd|autis(?:m|tic)|depress(?:ion|ed)|anxiety disorder|narciss(?:ist|ism)|psychopath|sociopath)\b/i.test(
				normalized
			) ||
			/\bpersonality\s+(?:type|disorder|trait)\b/i.test(normalized) ||
			/\b(?:you|the user|the creator|the author)\b[^.]{0,100}\b(?:disorder|diagnos|adhd|autis|depress|anxiety|narciss|psychopath|sociopath)\b/i.test(
				normalized
			);
		return diagnostic && !disclaimer;
	};
	/** @param {unknown} value @param {string} label */
	const validateClaimLanguage = (value, label) => {
		if (hasDiagnosticClaim(value))
			errors.push(`${label} contains diagnostic or personality language`);
	};
	/** @param {unknown} ids @param {string} label @param {boolean} [required] */
	const validateEvidence = (ids, label, required = true) => {
		if (!Array.isArray(ids)) {
			errors.push(`${label} must be an array`);
			return;
		}
		if (required && ids.length === 0) errors.push(`${label} must cite evidence`);
		for (const id of ids) {
			if (typeof id !== 'string' || !validItemIds.has(id))
				errors.push(`${label} contains an unknown item ID`);
		}
	};

	if (!output || typeof output !== 'object') {
		return { valid: false, errors: ['Profile output must be an object'] };
	}
	if (!output.profile || typeof output.profile !== 'object') {
		errors.push('profile is required');
	} else {
		if (!isText(output.profile.title)) errors.push('profile.title is required');
		if (!isText(output.profile.summary)) errors.push('profile.summary is required');
		if (!isConfidence(output.profile.confidence)) errors.push('profile.confidence is invalid');
		validateClaimLanguage(output.profile.title, 'profile.title');
		validateClaimLanguage(output.profile.summary, 'profile.summary');
	}

	if (!Array.isArray(output.sections) || output.sections.length > 8) {
		errors.push('sections must be an array with at most eight entries');
	} else {
		for (const [index, section] of output.sections.entries()) {
			if (!section || typeof section !== 'object') {
				errors.push(`sections[${index}] must be an object`);
				continue;
			}
			for (const field of ['id', 'title', 'thesis', 'analysis']) {
				if (!isText(section[field])) errors.push(`sections[${index}].${field} is required`);
				validateClaimLanguage(section[field], `sections[${index}].${field}`);
			}
			validateEvidence(section.evidenceItemIds, `sections[${index}].evidenceItemIds`);
			validateEvidence(
				section.counterEvidenceItemIds || [],
				`sections[${index}].counterEvidenceItemIds`,
				false
			);
			if (!isConfidence(section.confidence))
				errors.push(`sections[${index}].confidence is invalid`);
		}
	}

	if (!Array.isArray(output.mindset) || output.mindset.length > 8) {
		errors.push('mindset must be an array with at most eight entries');
	} else {
		for (const [index, contrast] of output.mindset.entries()) {
			if (!contrast || typeof contrast !== 'object') {
				errors.push(`mindset[${index}] must be an object`);
				continue;
			}
			for (const field of ['left', 'right', 'leansToward', 'explanation']) {
				if (!isText(contrast[field])) errors.push(`mindset[${index}].${field} is required`);
				validateClaimLanguage(contrast[field], `mindset[${index}].${field}`);
			}
			if (!isScore(contrast.strength))
				errors.push(`mindset[${index}].strength must be an integer from 0 to 10`);
			validateEvidence(contrast.evidenceItemIds, `mindset[${index}].evidenceItemIds`);
		}
	}

	if (!Array.isArray(output.tasteVector) || output.tasteVector.length > 12) {
		errors.push('tasteVector must be an array with at most twelve entries');
	} else {
		for (const [index, dimension] of output.tasteVector.entries()) {
			if (!dimension || typeof dimension !== 'object') {
				errors.push(`tasteVector[${index}] must be an object`);
				continue;
			}
			for (const field of ['id', 'name', 'summary']) {
				if (!isText(dimension[field])) errors.push(`tasteVector[${index}].${field} is required`);
				validateClaimLanguage(dimension[field], `tasteVector[${index}].${field}`);
			}
			if (!isScore(dimension.score))
				errors.push(`tasteVector[${index}].score must be an integer from 0 to 10`);
			if (!isConfidence(dimension.confidence))
				errors.push(`tasteVector[${index}].confidence is invalid`);
			validateEvidence(dimension.evidenceItemIds, `tasteVector[${index}].evidenceItemIds`);
			validateEvidence(
				dimension.counterEvidenceItemIds || [],
				`tasteVector[${index}].counterEvidenceItemIds`,
				false
			);
		}
	}

	if (
		!Array.isArray(output.limitations) ||
		output.limitations.some(/** @param {unknown} item */ (item) => !isText(item))
	) {
		errors.push('limitations must be an array of text');
	} else {
		output.limitations.forEach(
			/** @param {string} limitation @param {number} index */
			(limitation, index) => validateClaimLanguage(limitation, `limitations[${index}]`)
		);
	}
	if (!isText(output.closingSummary)) errors.push('closingSummary is required');
	validateClaimLanguage(output.closingSummary, 'closingSummary');

	return { valid: errors.length === 0, errors };
}

import { json } from '@sveltejs/kit';
import { getOpenRouterApiKey } from '#lib/server/openrouter.js';
import { generateTasteProfile } from '#lib/server/tasteProfileAnalysis.js';
import { getJudgeProfile } from '#lib/server/tasteProfiles.js';
import { getAnalysisEligibility } from '#lib/services/tasteProfile.js';
import {
	normalizeRequestBoard,
	validateEnrichedItems,
	validateRequestBoard
} from '#lib/server/tasteProfileHttp.js';

/** @param {string} code @param {string} message @param {number} status @param {unknown} [details] */
function errorResponse(code, message, status, details) {
	return json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	if (!getOpenRouterApiKey()) {
		return errorResponse('AI_KEY_MISSING', 'OpenRouter API key is not configured.', 503);
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return errorResponse('INVALID_JSON', 'Request body must be valid JSON.', 400);
	}

	const board = normalizeRequestBoard(body?.board || body);
	const requestValidation = validateRequestBoard(board);
	if (!requestValidation.valid)
		return errorResponse(
			requestValidation.code || 'INVALID_REQUEST',
			requestValidation.message || 'Invalid board request.',
			422
		);

	const eligibility = getAnalysisEligibility(board);
	if (!eligibility.eligible)
		return errorResponse(eligibility.code, eligibility.message, 422, eligibility);

	const profileId = typeof body?.profileId === 'string' ? body.profileId : '';
	const profile = getJudgeProfile(profileId);
	if (!profile)
		return errorResponse(
			'UNKNOWN_JUDGE_PROFILE',
			'The selected judge profile is not available.',
			422
		);

	const enrichment = validateEnrichedItems(
		body?.enrichedItems,
		board.items.map(/** @param {{ id: string }} item */ (item) => item.id)
	);
	if (!enrichment.valid)
		return errorResponse(
			enrichment.code || 'INVALID_ENRICHMENT',
			enrichment.message || 'Invalid enrichment data.',
			422
		);

	try {
		const snapshot = await generateTasteProfile({
			board,
			profileId: profile.id,
			language: typeof body?.language === 'string' ? body.language.slice(0, 10) : 'en',
			enrichedItems: /** @type {import('#lib/types.js').EnrichedItem[]} */ (enrichment.items || []),
			enrichmentReport: Array.isArray(body?.enrichmentReport) ? body.enrichmentReport : []
		});
		return json(snapshot);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unexpected taste profile error.';
		const code = error instanceof Error ? message.split(';')[0] : 'INTERNAL_ERROR';
		if (code === 'UNANALYZABLE_LIST') return errorResponse(code, message, 422);
		if (code === 'INVALID_MODEL_OUTPUT')
			return errorResponse(
				code,
				'The analysis response did not satisfy the evidence contract.',
				502
			);
		console.error('Taste Profile analysis error:', error);
		return errorResponse(
			'INTERNAL_ERROR',
			'An unexpected error occurred during taste analysis.',
			500
		);
	}
}

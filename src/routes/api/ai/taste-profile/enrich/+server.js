import { json } from '@sveltejs/kit';
import { getJudgeProfile, checkEnrichmentCompatibility } from '#lib/server/tasteProfiles.js';
import { enrichTasteItems } from '#lib/server/tasteProfileAdapters.js';
import { getAnalysisEligibility } from '#lib/services/tasteProfile.js';
import { normalizeRequestBoard, validateRequestBoard } from '#lib/server/tasteProfileHttp.js';

/** @param {string} code @param {string} message @param {number} status @param {unknown} [details] */
function errorResponse(code, message, status, details) {
	return json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
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

	const language = typeof body?.language === 'string' ? body.language.slice(0, 10) : 'en';
	const result = await enrichTasteItems(board.items, profile.id, language);
	const compatibility = checkEnrichmentCompatibility(profile.id, result.items);
	if (!compatibility.compatible) {
		return errorResponse('UNANALYZABLE_LIST', compatibility.message, 422, {
			profileId: profile.id,
			enrichmentReport: result.report
		});
	}

	return json({
		profileId: profile.id,
		profileVersion: profile.version,
		eligibility,
		compatibility,
		enrichedItems: result.items,
		enrichmentReport: result.report
	});
}

import { json } from '@sveltejs/kit';
import { getAnalysisEligibility } from '#lib/services/tasteProfile.js';
import { detectJudgeProfile, listJudgeProfiles } from '#lib/server/tasteProfiles.js';
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
	if (!requestValidation.valid) {
		return errorResponse(
			requestValidation.code || 'INVALID_REQUEST',
			requestValidation.message || 'Invalid board request.',
			422
		);
	}

	const eligibility = getAnalysisEligibility(board);
	const detection = detectJudgeProfile(board);
	return json({
		eligibility,
		suggestedProfile: detection.suggestedProfile,
		confidence: detection.confidence,
		rationale: detection.rationale,
		scores: detection.scores,
		language: typeof body?.language === 'string' ? body.language.slice(0, 10) : 'en',
		profiles: listJudgeProfiles().map((profile) => ({
			id: profile.id,
			version: profile.version,
			label: profile.label,
			description: profile.description
		}))
	});
}

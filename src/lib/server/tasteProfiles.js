/**
 * Curated judging frameworks. These are product methodology, not personality
 * diagnoses. Runtime analysis applies one of these profiles to board evidence.
 * @typedef {import('#lib/types.js').JudgeProfile} JudgeProfile
 * @typedef {import('#lib/types.js').JudgeProfileId} JudgeProfileId
 */

/** @type {JudgeProfileId[]} */
export const JUDGE_PROFILE_IDS = ['games', 'movies', 'music', 'books', 'general'];

/** @type {Record<JudgeProfileId, JudgeProfile>} */
export const JUDGE_PROFILES = {
	games: {
		id: 'games',
		version: 1,
		label: 'Video Games',
		description: 'How a player appears to value play, worlds, expression, and mastery.',
		detectionTerms: [
			'game',
			'games',
			'video game',
			'videogame',
			'gaming',
			'playstation',
			'xbox',
			'nintendo',
			'steam'
		],
		comparableDimensions: [
			'Exploration',
			'Mechanical Mastery',
			'Player Expression',
			'World Immersion',
			'Character Attachment',
			'Systems Complexity',
			'Challenge',
			'Social Play'
		],
		emergentDimensionExamples: [
			'Movement as Gameplay',
			'Creature Worlds',
			'Cute + Melancholic',
			'Retro Design DNA'
		],
		evidenceRules: [
			'Compare repeated mechanics and experiences across different genres.',
			'Distinguish execution difficulty from strategic complexity and grind.',
			'Use genre labels as clues, never as the final explanation.',
			'Inspect exceptions before consolidating a gameplay preference.'
		],
		forbiddenClaims: [
			'personality diagnosis',
			'mental health claims',
			'political claims',
			'sociality diagnosis'
		],
		promptGuidance:
			'Look for the experiences the player repeatedly rewards, especially when a mechanical or emotional pattern crosses genre boundaries.'
	},
	movies: {
		id: 'movies',
		version: 1,
		label: 'Films & Television',
		description:
			'How a viewer appears to value stories, tone, image, performance, and cinematic identity.',
		detectionTerms: [
			'movie',
			'movies',
			'film',
			'films',
			'cinema',
			'television',
			'tv',
			'series',
			'show'
		],
		comparableDimensions: [
			'Narrative Engagement',
			'Emotional Intensity',
			'Visual Identity',
			'Character Attachment',
			'Tonal Range',
			'Worldbuilding',
			'Formal Experimentation',
			'Comfort'
		],
		emergentDimensionExamples: [
			'Stylized Melancholy',
			'Moral Ambiguity',
			'World-First Spectacle',
			'Deadpan Warmth'
		],
		evidenceRules: [
			'Distinguish plot preference from tone, performance, visual language, and pacing.',
			'Compare recurring creative identities across directors, genres, and eras.',
			'Treat ratings and popularity as context, not evidence of the user’s taste.',
			'Use omissions cautiously because a list may be genre- or era-limited.'
		],
		forbiddenClaims: [
			'personality diagnosis',
			'mental health claims',
			'moral character claims',
			'political claims'
		],
		promptGuidance:
			'Explain what kind of viewing experience the selections reward, not merely which genres or directors occur most often.'
	},
	music: {
		id: 'music',
		version: 1,
		label: 'Music',
		description:
			'How a listener appears to value sound, emotion, identity, performance, and musical world-building.',
		detectionTerms: [
			'music',
			'album',
			'albums',
			'song',
			'songs',
			'artist',
			'band',
			'playlist',
			'record'
		],
		comparableDimensions: [
			'Emotional Range',
			'Sonic Experimentation',
			'Atmosphere',
			'Vocal or Instrumental Expression',
			'Rhythmic Energy',
			'Lyrical Focus',
			'Comfort',
			'Identity'
		],
		emergentDimensionExamples: [
			'Beautiful Abrasion',
			'Night Driving',
			'Theatrical Excess',
			'Intimacy Through Texture'
		],
		evidenceRules: [
			'Distinguish genre, mood, production, performance, lyrics, and cultural era.',
			'Look for shared listening experiences across apparently different genres.',
			'Do not infer stable personality traits from genre associations.',
			'Use repeated artists or albums as stronger evidence than one-off placements.'
		],
		forbiddenClaims: [
			'personality diagnosis',
			'mental health claims',
			'political claims',
			'moral character claims'
		],
		promptGuidance:
			'Find the sonic or emotional reward underneath genre labels: texture, tension, intimacy, movement, catharsis, or identity.'
	},
	books: {
		id: 'books',
		version: 1,
		label: 'Books',
		description:
			'How a reader appears to value ideas, voice, characters, structure, and imagined worlds.',
		detectionTerms: [
			'book',
			'books',
			'novel',
			'novels',
			'reading',
			'author',
			'literature',
			'fiction',
			'nonfiction'
		],
		comparableDimensions: [
			'Narrative Immersion',
			'Character Attachment',
			'Ideas and Inquiry',
			'Worldbuilding',
			'Prose and Voice',
			'Emotional Intensity',
			'Formal Experimentation',
			'Comfort'
		],
		emergentDimensionExamples: [
			'Domestic Weirdness',
			'Lore Hunger',
			'Tender Brutality',
			'Voice as the Plot'
		],
		evidenceRules: [
			'Distinguish subject matter from prose, structure, voice, and reader experience.',
			'Compare recurring concerns without treating genre as psychology.',
			'Account for whether the list is fiction, nonfiction, or a constrained reading category.',
			'Use author recurrence and series patterns as evidence, not as a substitute for analysis.'
		],
		forbiddenClaims: [
			'personality diagnosis',
			'mental health claims',
			'political claims',
			'moral character claims'
		],
		promptGuidance:
			'Explain what the reader seems to seek from reading: a voice, a world, an argument, a relationship, a question, or a particular emotional pressure.'
	},
	general: {
		id: 'general',
		version: 1,
		label: 'General Taste',
		description:
			'A conservative framework for coherent lists without a specialized domain profile.',
		detectionTerms: [],
		comparableDimensions: [
			'Identity',
			'Emotional Resonance',
			'Complexity',
			'Experimentation',
			'Comfort',
			'Intensity'
		],
		emergentDimensionExamples: ['Distinctive Personal Pattern'],
		evidenceRules: [
			'Use only patterns directly supported by repeated items and tier placement.',
			'Treat missing categories as unknown unless the list context makes absence meaningful.',
			'Prefer fewer conclusions with strong evidence over a complete-looking profile.'
		],
		forbiddenClaims: [
			'personality diagnosis',
			'mental health claims',
			'political claims',
			'moral character claims'
		],
		promptGuidance:
			'Be conservative. Describe recurring properties of the selected items and how the user ranks them without forcing a domain-specific theory.'
	}
};

/**
 * @param {unknown} id
 * @returns {JudgeProfile | null}
 */
export function getJudgeProfile(id) {
	return typeof id === 'string' && id in JUDGE_PROFILES
		? JUDGE_PROFILES[/** @type {JudgeProfileId} */ (id)]
		: null;
}

/**
 * @returns {JudgeProfile[]}
 */
export function listJudgeProfiles() {
	return JUDGE_PROFILE_IDS.map((id) => JUDGE_PROFILES[id]);
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
	return (value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * @param {{ title?: string; context?: string; items?: Array<{ name?: string }> }} board
 * @returns {{ suggestedProfile: JudgeProfileId; confidence: import('#lib/types.js').ConfidenceLevel; rationale: string; scores: Record<JudgeProfileId, number> }}
 */
export function detectJudgeProfile(board) {
	const corpus = normalize(`${board?.title || ''} ${board?.context || ''}`);
	const scores = /** @type {Record<JudgeProfileId, number>} */ ({
		games: 0,
		movies: 0,
		music: 0,
		books: 0,
		general: 0
	});

	for (const profile of listJudgeProfiles()) {
		for (const term of profile.detectionTerms) {
			if (corpus.includes(normalize(term))) scores[profile.id] += term.includes(' ') ? 3 : 1;
		}
	}

	const ranked = Object.entries(scores)
		.filter(([id]) => id !== 'general')
		.sort((a, b) => b[1] - a[1]);
	const [winner, winnerScore] = ranked[0] || ['general', 0];
	const secondScore = ranked[1]?.[1] || 0;
	const suggestedProfile =
		winnerScore > 0 && winnerScore > secondScore
			? /** @type {JudgeProfileId} */ (winner)
			: 'general';
	const confidence =
		winnerScore >= 4 && winnerScore > secondScore + 1 ? 'high' : winnerScore > 0 ? 'medium' : 'low';
	const profile = JUDGE_PROFILES[suggestedProfile];

	return {
		suggestedProfile,
		confidence,
		rationale:
			suggestedProfile === 'general'
				? 'The list context does not identify one specialized domain clearly enough.'
				: `The title and context contain signals associated with ${profile.label}.`,
		scores
	};
}

/**
 * @param {JudgeProfileId} profileId
 * @param {Array<{ domain?: string; status?: string }>} enrichedItems
 * @returns {{ compatible: boolean; message: string }}
 */
export function checkEnrichmentCompatibility(profileId, enrichedItems) {
	if (profileId === 'general') {
		return { compatible: true, message: 'General profile accepts coherent mixed media lists.' };
	}

	const domains = new Set(enrichedItems.map((item) => item.domain).filter(Boolean));
	const failed = enrichedItems.filter((item) => item.status === 'unavailable').length;
	if (domains.size > 1) {
		return {
			compatible: false,
			message: 'This list mixes domains that cannot be compared by one specialized judge profile.'
		};
	}

	if (domains.size === 1 && !domains.has(profileId)) {
		return {
			compatible: false,
			message: 'The selected judge profile does not match the enriched entities.'
		};
	}

	return {
		compatible: true,
		message:
			failed > 0
				? `${failed} items could not be enriched and will reduce confidence.`
				: 'Entities are compatible with the selected profile.'
	};
}

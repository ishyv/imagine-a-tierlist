/**
 * OpenRouter service with layered routing:
 * 1. google/gemini-3.5-flash-lite (ultra-fast sub-second response)
 * 2. google/gemini-2.5-flash
 * 3. nvidia/nemotron-3.5-lightning:free
 * Note: OpenRouter API allows a maximum of 3 models in the 'models' array.
 */

import { getEnv } from '#lib/server/env.js';

export const LAYERED_MODELS = [
	'google/gemini-3.5-flash-lite',
	'google/gemini-2.5-flash',
	'nvidia/nemotron-3.5-lightning:free'
];

/**
 * Gets OpenRouter API key from environment
 * @returns {string}
 */
export function getOpenRouterApiKey() {
	return getEnv('OPEN_API_KEY') || getEnv('OPENROUTER_API_KEY');
}

/**
 * Calls OpenRouter chat completion API with layered fallback routing and timeout
 * @param {Array<{ role: string; content: string }>} messages
 * @param {number} [temperature]
 * @param {number} [timeoutMs]
 * @returns {Promise<string | null>}
 */
export async function callOpenRouter(messages, temperature = 0.3, timeoutMs = 6000) {
	const apiKey = getOpenRouterApiKey();
	if (!apiKey) return null;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://imagine-a-tierlist.local',
				'X-Title': 'On-Demand Tier List'
			},
			body: JSON.stringify({
				models: LAYERED_MODELS,
				messages,
				temperature
			}),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!res.ok) {
			const errText = await res.text().catch(() => '');
			console.error(`OpenRouter error (${res.status}):`, errText);
			return null;
		}

		const data = await res.json();
		return data.choices?.[0]?.message?.content || null;
	} catch (e) {
		clearTimeout(timeoutId);
		console.warn('OpenRouter request timed out or failed:', e);
		return null;
	}
}

/**
 * Extracts and parses JSON from model output
 * @param {string | null} text
 * @returns {any | null}
 */
export function extractJson(text) {
	if (!text) return null;

	const trimmed = text.trim();

	/**
	 * @param {string} str
	 */
	const tryParse = (str) => {
		try {
			return JSON.parse(str);
		} catch {
			return null;
		}
	};

	const direct = tryParse(trimmed);
	if (direct !== null) return direct;

	// Attempt extracting from markdown code block
	const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
	if (codeBlockMatch && codeBlockMatch[1]) {
		const parsed = tryParse(codeBlockMatch[1].trim());
		if (parsed !== null) return parsed;
	}

	// Attempt finding first [ ... ] or { ... }
	const arrayMatch = trimmed.match(/\[[\s\S]*\]/);
	if (arrayMatch) {
		const parsed = tryParse(arrayMatch[0]);
		if (parsed !== null) return parsed;
	}

	const objMatch = trimmed.match(/\{[\s\S]*\}/);
	if (objMatch) {
		const parsed = tryParse(objMatch[0]);
		if (parsed !== null) return parsed;
	}

	return null;
}

/**
 * Generates a structured list of items for bulk tier list generation
 * Supports multi-batch expansion for large requests up to 150 items
 * @param {string} prompt User prompt (e.g. "All League of Legends champions" or "All Gen 1 starter evolutions")
 * @param {string} [context] Board context
 * @param {string[]} [existingNames] List of names already on board to avoid duplicates
 * @param {number} [count] Desired item count (default 15, up to 150)
 * @returns {Promise<Array<{ name: string; searchQuery: string }>>}
 */
export async function generateBulkItems(prompt, context = '', existingNames = [], count = 15) {
	const targetCount = Math.min(Math.max(count || 15, 1), 150);
	const seenNames = new Set(existingNames.map((n) => n.toLowerCase().trim()));
	/** @type {Array<{ name: string; searchQuery: string }>} */
	const accumulated = [];

	const systemPrompt = `You are an exhaustive tier list entity generator. Given a prompt and context, return a comprehensive, canonical, and accurate list of entities/items matching the prompt.
Return ONLY a valid JSON array of objects in this exact schema:
[
  {
    "name": "Canonical display name of the item",
    "searchQuery": "Optimal search query for finding character art / official icon / logo"
  }
]
Do NOT include any commentary, explanations, or markdown fences outside the JSON.`;

	// Chunk into passes of up to 40 items per pass
	const batchSize = Math.min(targetCount, 40);
	let remaining = targetCount;
	let attempts = 0;
	const maxAttempts = Math.ceil(targetCount / 30) + 1;

	while (remaining > 0 && attempts < maxAttempts) {
		attempts++;
		const currentBatchRequest = Math.min(remaining, batchSize);

		const userPrompt = `Generate ${currentBatchRequest} distinct items for: "${prompt}"
Context / Franchise: "${context || 'General'}"
${accumulated.length > 0 || existingNames.length > 0 ? `Already listed (DO NOT DUPLICATE ANY OF THESE): ${[...existingNames, ...accumulated.map((i) => i.name)].slice(0, 100).join(', ')}` : ''}

Make sure every item is unique, iconic/canonical, and has a specific searchQuery designed for finding image art.`;

		const responseText = await callOpenRouter(
			[
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			],
			0.35,
			14000
		);

		const parsed = extractJson(responseText);
		if (Array.isArray(parsed) && parsed.length > 0) {
			let addedThisPass = 0;
			for (const item of parsed) {
				if (item && typeof item.name === 'string') {
					const cleanName = item.name.trim();
					const lowerName = cleanName.toLowerCase();
					if (cleanName && !seenNames.has(lowerName)) {
						seenNames.add(lowerName);
						accumulated.push({
							name: cleanName,
							searchQuery: (item.searchQuery || `${cleanName} ${context}`.trim()).trim()
						});
						addedThisPass++;
					}
				}
			}

			remaining = targetCount - accumulated.length;

			// If the model couldn't produce any new items, we've likely hit the full roster
			if (addedThisPass === 0) {
				break;
			}
		} else {
			// Single-pass fallback failure
			break;
		}
	}

	return accumulated;
}

/**
 * Normalizes and disambiguates misspelled or vague queries into canonical search terms
 * @param {string} query
 * @param {string} [context]
 * @returns {Promise<{ canonicalName: string; searchQuery: string; category?: string } | null>}
 */
export async function disambiguateQuery(query, context = '') {
	const systemPrompt = `You are an entity disambiguation engine. Given a user query (which may have typos, aliases, or vague descriptions) and optional board context, identify the exact canonical entity name and produce an optimized image search query.
Return ONLY a valid JSON object in this exact schema:
{
  "canonicalName": "Correct Full Name",
  "searchQuery": "Optimized image search keywords (e.g. character official splash art)",
  "category": "Franchise or entity category"
}`;

	const userPrompt = `User query: "${query}"
Board context: "${context || 'None specified'}"

Determine the exact canonical entity.`;

	const responseText = await callOpenRouter(
		[
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		],
		0.2,
		6000
	);

	const parsed = extractJson(responseText);
	if (parsed && typeof parsed.canonicalName === 'string' && parsed.canonicalName.trim()) {
		return {
			canonicalName: parsed.canonicalName.trim(),
			searchQuery: (
				parsed.searchQuery || `${parsed.canonicalName.trim()} ${context}`.trim()
			).trim(),
			category: parsed.category ? parsed.category.trim() : undefined
		};
	}

	return null;
}

/**
 * Automatically ranks a list of items across tiers based on specified criteria
 * @param {Array<{ id: string; name: string }>} items Items to rank
 * @param {Array<{ id: string; label: string; order: number }>} tiers Tiers sorted best to worst
 * @param {string} [criteria] Ranking criteria (e.g. "Popularity", "Power level", or custom text)
 * @param {string} [context] Board context
 * @returns {Promise<Array<{ itemId: string; tierId: string; reason: string }>>}
 */
export async function autoRankItems(
	items,
	tiers,
	criteria = 'Overall Quality & Impact',
	context = ''
) {
	if (!items.length || !tiers.length) return [];

	const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);
	const tierDescriptions = sortedTiers
		.map(
			(t, idx) =>
				`Tier ID: "${t.id}" -> Label: "${t.label}" (${idx === 0 ? 'Highest/Best' : idx === sortedTiers.length - 1 ? 'Lowest' : 'Middle'})`
		)
		.join('\n');

	const itemList = items.map((i) => `- ID: "${i.id}", Name: "${i.name}"`).join('\n');

	const systemPrompt = `You are an expert tier list arbitrator. Your task is to rank items into tiers based on the user's criteria.
Distribute the items fairly across the available tiers (do NOT put all items in S or F unless justified).
Return ONLY a valid JSON array of objects in this exact format:
[
  {
    "itemId": "exact_item_id_from_input",
    "tierId": "exact_tier_id_from_tiers",
    "reason": "Short 1-sentence rationale for this placement"
  }
]`;

	const userPrompt = `Board Context: "${context || 'General'}"
Ranking Criteria: "${criteria || 'Overall Quality & Impact'}"

Available Tiers (from best to worst):
${tierDescriptions}

Items to Rank:
${itemList}

Distribute every item across the tiers.`;

	const responseText = await callOpenRouter(
		[
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		],
		0.4,
		12000
	);

	const parsed = extractJson(responseText);
	if (Array.isArray(parsed)) {
		const validTierIds = new Set(tiers.map((t) => t.id));
		const validItemIds = new Set(items.map((i) => i.id));

		return parsed
			.filter((entry) => validItemIds.has(entry.itemId) && validTierIds.has(entry.tierId))
			.map((entry) => ({
				itemId: entry.itemId,
				tierId: entry.tierId,
				reason: entry.reason || ''
			}));
	}

	return [];
}

/**
 * Suggests related items to add to the tier list based on title and context
 * @param {string} title Board title
 * @param {string} [context] Board context
 * @param {string[]} [existingNames] Existing names to avoid
 * @param {number} [count] Number of suggestions (default 8)
 * @returns {Promise<string[]>} Array of suggested item names
 */
export async function suggestRelatedItems(title, context = '', existingNames = [], count = 8) {
	const systemPrompt = `You are a tier list assistant. Given a board title and optional context, suggest a concise list of popular/essential items that belong on this tier list.
Return ONLY a valid JSON array of strings:
["Item 1", "Item 2", "Item 3", ...]`;

	const userPrompt = `Tier List Title: "${title || 'Tier List'}"
Context: "${context || title || 'General'}"
${existingNames.length > 0 ? `Already on the board (DO NOT suggest these): ${existingNames.slice(0, 40).join(', ')}` : ''}

Suggest ${count} popular, iconic items that should be added to this tier list.`;

	const responseText = await callOpenRouter(
		[
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		],
		0.5,
		8000
	);

	const parsed = extractJson(responseText);
	if (Array.isArray(parsed)) {
		const existingSet = new Set(existingNames.map((n) => n.toLowerCase().trim()));
		return parsed
			.filter((name) => typeof name === 'string' && name.trim().length > 0)
			.map((name) => name.trim())
			.filter((name) => !existingSet.has(name.toLowerCase()))
			.slice(0, count);
	}

	return [];
}

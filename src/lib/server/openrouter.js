/**
 * OpenRouter service with layered routing:
 * 1. Free tier models: google/gemma-4-31b-it:free, nvidia/nemotron-3.5-lightning:free
 * 2. Fallback ultra-cheap model: google/gemma-3-4b-it ($0.05 / 1M)
 * Note: OpenRouter API allows a maximum of 3 models in the 'models' array.
 */

export const LAYERED_MODELS = [
	'google/gemma-4-31b-it:free',
	'nvidia/nemotron-3.5-lightning:free',
	'google/gemma-3-4b-it'
];

/**
 * Gets OpenRouter API key from environment
 * @returns {string}
 */
export function getOpenRouterApiKey() {
	return (process.env.OPEN_API_KEY || process.env.OPENROUTER_API_KEY || '').trim();
}

/**
 * Calls OpenRouter chat completion API with layered fallback routing
 * @param {Array<{ role: string; content: string }>} messages
 * @param {number} [temperature]
 * @returns {Promise<string | null>}
 */
export async function callOpenRouter(messages, temperature = 0.3) {
	const apiKey = getOpenRouterApiKey();
	if (!apiKey) return null;

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
			})
		});

		if (!res.ok) {
			const errText = await res.text().catch(() => '');
			console.error(`OpenRouter error (${res.status}):`, errText);
			return null;
		}

		const data = await res.json();
		return data.choices?.[0]?.message?.content || null;
	} catch (e) {
		console.error('Failed to call OpenRouter:', e);
		return null;
	}
}

/**
 * Uses OpenRouter layered models to generate/suggest image URLs for an entity
 * @param {string} query
 * @param {string} [context]
 * @returns {Promise<import('#lib/types.js').ImageSearchResult[]>}
 */
export async function searchImagesWithAi(query, context = '') {
	const prompt = `Find public image URLs (Wikimedia, fandom wikis, Wikipedia, official CDNs) for "${query}"${context ? ` in context "${context}"` : ''}.
Return a JSON array of up to 4 objects strictly matching this schema:
[
  {
    "title": "Title or form name",
    "imageUrl": "https://example.com/direct-image.jpg",
    "thumbnailUrl": "https://example.com/direct-image.jpg",
    "sourceUrl": "https://example.com"
  }
]
Output only valid JSON.`;

	const responseText = await callOpenRouter([
		{
			role: 'system',
			content: 'You output valid raw JSON array only. Do not include markdown commentary.'
		},
		{ role: 'user', content: prompt }
	]);

	if (!responseText) return [];

	try {
		const cleaned = responseText
			.replace(/```json/g, '')
			.replace(/```/g, '')
			.trim();
		const parsed = JSON.parse(cleaned);
		if (Array.isArray(parsed)) {
			return parsed
				.map((item, idx) => ({
					id: `ai-${idx}-${Date.now()}`,
					title: item.title || query,
					imageUrl: item.imageUrl || '',
					thumbnailUrl: item.thumbnailUrl || item.imageUrl || '',
					sourceUrl: item.sourceUrl || ''
				}))
				.filter((item) => Boolean(item.imageUrl));
		}
	} catch (e) {
		console.warn('Failed to parse AI image results:', e);
	}

	return [];
}

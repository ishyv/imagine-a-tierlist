import { json } from '@sveltejs/kit';
import { generateBulkItems, getOpenRouterApiKey } from '#lib/server/openrouter.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const apiKey = getOpenRouterApiKey();
	if (!apiKey) {
		return json(
			{
				error: 'AI_KEY_MISSING',
				message:
					'OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment.'
			},
			{ status: 503 }
		);
	}

	try {
		const body = await request.json();
		const prompt = (body.prompt || '').trim();
		const context = (body.context || '').trim();
		const existingNames = Array.isArray(body.existingNames) ? body.existingNames : [];
		const count = typeof body.count === 'number' && body.count > 0 ? Math.min(body.count, 150) : 15;

		if (!prompt) {
			return json(
				{ error: 'PROMPT_REQUIRED', message: 'A prompt describing items to generate is required.' },
				{ status: 400 }
			);
		}

		const items = await generateBulkItems(prompt, context, existingNames, count);

		if (!items || items.length === 0) {
			return json(
				{
					error: 'GENERATION_FAILED',
					message: 'Could not generate items. Please try rephrasing your prompt.'
				},
				{ status: 502 }
			);
		}

		return json({
			prompt,
			count: items.length,
			items
		});
	} catch (e) {
		console.error('Bulk generation API error:', e);
		return json(
			{ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred during item generation.' },
			{ status: 500 }
		);
	}
}

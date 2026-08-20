import { json } from '@sveltejs/kit';
import { suggestRelatedItems, getOpenRouterApiKey } from '#lib/server/openrouter.js';

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
		const title = (body.title || '').trim();
		const context = (body.context || '').trim();
		const existingNames = Array.isArray(body.existingNames) ? body.existingNames : [];
		const count = typeof body.count === 'number' && body.count > 0 ? Math.min(body.count, 20) : 8;

		if (!title && !context) {
			return json(
				{
					error: 'CONTEXT_REQUIRED',
					message: 'Board title or context is required for suggestions.'
				},
				{ status: 400 }
			);
		}

		const suggestions = await suggestRelatedItems(title, context, existingNames, count);

		return json({
			title,
			context,
			count: suggestions.length,
			suggestions
		});
	} catch (e) {
		console.error('Suggestions API error:', e);
		return json(
			{
				error: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred while generating suggestions.'
			},
			{ status: 500 }
		);
	}
}

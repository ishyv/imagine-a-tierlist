import { json } from '@sveltejs/kit';
import { disambiguateQuery, getOpenRouterApiKey } from '#lib/server/openrouter.js';

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
		const query = (body.query || '').trim();
		const context = (body.context || '').trim();

		if (!query) {
			return json(
				{ error: 'QUERY_REQUIRED', message: 'A query to disambiguate is required.' },
				{ status: 400 }
			);
		}

		const result = await disambiguateQuery(query, context);

		if (!result) {
			return json(
				{
					error: 'DISAMBIGUATION_FAILED',
					message: 'Could not disambiguate query.',
					canonicalName: query,
					searchQuery: context ? `${query} ${context}` : query
				},
				{ status: 200 }
			);
		}

		return json(result);
	} catch (e) {
		console.error('Disambiguation API error:', e);
		return json(
			{ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred during disambiguation.' },
			{ status: 500 }
		);
	}
}

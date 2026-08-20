import { json } from '@sveltejs/kit';
import { autoRankItems, getOpenRouterApiKey } from '#lib/server/openrouter.js';

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
		const items = Array.isArray(body.items) ? body.items : [];
		const tiers = Array.isArray(body.tiers) ? body.tiers : [];
		const criteria = (body.criteria || '').trim();
		const context = (body.context || '').trim();

		if (items.length === 0) {
			return json({ error: 'NO_ITEMS', message: 'No items provided to rank.' }, { status: 400 });
		}

		if (tiers.length === 0) {
			return json(
				{ error: 'NO_TIERS', message: 'No tiers provided for ranking.' },
				{ status: 400 }
			);
		}

		const rankings = await autoRankItems(items, tiers, criteria, context);

		return json({
			criteria,
			rankedCount: rankings.length,
			rankings
		});
	} catch (e) {
		console.error('Auto-ranking API error:', e);
		return json(
			{ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred during auto-ranking.' },
			{ status: 500 }
		);
	}
}

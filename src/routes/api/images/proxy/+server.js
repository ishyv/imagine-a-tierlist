import { json } from '@sveltejs/kit';

/**
 * Checks if a hostname resolves to a private, loopback, or internal IP range (SSRF guard)
 * @param {string} hostname
 * @returns {boolean}
 */
function isPrivateHost(hostname) {
	const lower = hostname.toLowerCase();

	if (
		lower === 'localhost' ||
		lower === '127.0.0.1' ||
		lower === '0.0.0.0' ||
		lower === '::1' ||
		lower.endsWith('.local') ||
		lower.endsWith('.internal')
	) {
		return true;
	}

	// IPv4 Private & Link-Local Ranges
	if (
		/^10\./.test(lower) ||
		/^192\.168\./.test(lower) ||
		/^169\.254\./.test(lower) ||
		/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower)
	) {
		return true;
	}

	return false;
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const targetUrl = url.searchParams.get('url');

	if (!targetUrl || typeof targetUrl !== 'string') {
		return json(
			{ error: 'URL_REQUIRED', message: 'The "url" query parameter is required.' },
			{ status: 400 }
		);
	}

	let parsedUrl;
	try {
		parsedUrl = new URL(targetUrl);
	} catch {
		return json(
			{ error: 'INVALID_URL', message: 'The provided URL could not be parsed.' },
			{ status: 400 }
		);
	}

	if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
		return json(
			{ error: 'INVALID_PROTOCOL', message: 'Only HTTP and HTTPS protocols are supported.' },
			{ status: 400 }
		);
	}

	if (isPrivateHost(parsedUrl.hostname)) {
		return json(
			{ error: 'FORBIDDEN_HOST', message: 'Access to internal or private hosts is prohibited.' },
			{ status: 403 }
		);
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

		const upstreamRes = await fetch(parsedUrl.toString(), {
			signal: controller.signal,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
				Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
				'Cache-Control': 'no-cache'
			},
			redirect: 'follow'
		});

		clearTimeout(timeoutId);

		if (!upstreamRes.ok) {
			return json(
				{
					error: 'UPSTREAM_ERROR',
					message: `Upstream image server responded with HTTP ${upstreamRes.status}`
				},
				{ status: upstreamRes.status >= 500 ? 502 : 404 }
			);
		}

		const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
		const imageBuffer = await upstreamRes.arrayBuffer();

		return new Response(imageBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, OPTIONS',
				'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
			}
		});
	} catch (err) {
		const isTimeout = err instanceof Error && err.name === 'AbortError';
		return json(
			{
				error: isTimeout ? 'TIMEOUT' : 'FETCH_FAILED',
				message: isTimeout
					? 'Timed out while fetching upstream image.'
					: 'Failed to retrieve remote image.'
			},
			{ status: isTimeout ? 504 : 500 }
		);
	}
}

/** @type {import('./$types').RequestHandler} */
export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400'
		}
	});
}

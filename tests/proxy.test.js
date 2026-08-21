import { describe, it, expect } from 'bun:test';
import { GET } from '../src/routes/api/images/proxy/+server.js';

describe('image proxy API endpoint', () => {
	it('returns 400 if url param is missing', async () => {
		const url = new URL('http://localhost/api/images/proxy');
		const res = await GET(/** @type {any} */ ({ url }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBe('URL_REQUIRED');
	});

	it('returns 400 for invalid URL format', async () => {
		const url = new URL('http://localhost/api/images/proxy?url=not-a-valid-url');
		const res = await GET(/** @type {any} */ ({ url }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBe('INVALID_URL');
	});

	it('returns 400 for non-http(s) protocols', async () => {
		const url = new URL('http://localhost/api/images/proxy?url=file:///etc/passwd');
		const res = await GET(/** @type {any} */ ({ url }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBe('INVALID_PROTOCOL');
	});

	it('blocks SSRF attempts on localhost and private networks', async () => {
		const localhostUrl = new URL(
			'http://localhost/api/images/proxy?url=http://localhost:3000/secret'
		);
		const res1 = await GET(/** @type {any} */ ({ url: localhostUrl }));
		expect(res1.status).toBe(403);

		const ip127 = new URL('http://localhost/api/images/proxy?url=http://127.0.0.1:8080/admin');
		const res2 = await GET(/** @type {any} */ ({ url: ip127 }));
		expect(res2.status).toBe(403);

		const ip10 = new URL('http://localhost/api/images/proxy?url=http://10.0.0.1/status');
		const res3 = await GET(/** @type {any} */ ({ url: ip10 }));
		expect(res3.status).toBe(403);

		const ip192 = new URL('http://localhost/api/images/proxy?url=http://192.168.1.1/setup');
		const res4 = await GET(/** @type {any} */ ({ url: ip192 }));
		expect(res4.status).toBe(403);
	});
});

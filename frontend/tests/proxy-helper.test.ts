import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proxyToBackend } from '../lib/proxy-helper';

test('shared proxy preserves binary bodies, cookies, authorization failures, and unavailable responses', async () => {
  const saved = globalThis.fetch;
  const env = process.env.API_PROXY_TARGET;
  process.env.API_PROXY_TARGET = 'https://api.nextechsystem.com';
  const request = (method = 'GET') => Object.assign(new Request('https://www.nextechsystem.com/api/test?q=1', { method, headers: { origin: 'https://www.nextechsystem.com', authorization: 'Bearer test', cookie: 'auth_token=test' }, ...(method === 'POST' ? { body: new Uint8Array([0, 255, 128, 1]) } : {}) }), { nextUrl: new URL('https://www.nextechsystem.com/api/test?q=1') });
  try {
    const bytes = new Uint8Array([80, 75, 0, 255, 128, 7]);
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.nextechsystem.com/api/test?q=1');
      assert.equal(new Headers(options?.headers).get('origin'), 'https://www.nextechsystem.com');
      assert.equal(new Headers(options?.headers).get('cookie'), 'auth_token=test');
      assert.deepEqual(new Uint8Array(options?.body as ArrayBuffer), new Uint8Array([0, 255, 128, 1]));
      return new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename=test.xlsx', 'Set-Cookie': 'auth_token=; Max-Age=0' } });
    };
    const download = await proxyToBackend(request('POST') as any, '/test');
    assert.deepEqual(new Uint8Array(await download.arrayBuffer()), bytes);
    assert.match(download.headers.get('content-disposition')!, /test.xlsx/);
    assert.match(download.headers.get('set-cookie')!, /Max-Age=0/);
    globalThis.fetch = async () => Response.json({ success: false }, { status: 403 });
    assert.equal((await proxyToBackend(request() as any, '/test', { fallbackData: [] })).status, 403);
    globalThis.fetch = async () => { throw new Error('offline'); };
    const unavailable = await proxyToBackend(request() as any, '/test', { fallbackData: { success: true } });
    assert.equal(unavailable.status, 503);
    assert.equal((await unavailable.json()).success, false);
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal((await proxyToBackend(request() as any, '/test')).status, 204);
    assert.equal((await proxyToBackend(request() as any, '/%2e%2e/admin')).status, 400);
  } finally {
    globalThis.fetch = saved;
    if (env === undefined) delete process.env.API_PROXY_TARGET; else process.env.API_PROXY_TARGET = env;
  }
});

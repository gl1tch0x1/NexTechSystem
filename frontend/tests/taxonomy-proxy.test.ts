import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proxyTaxonomy } from '../lib/taxonomy-proxy';

test('taxonomy proxy uses NexTech API and preserves empty lists and upstream errors', async () => {
  const originalFetch = globalThis.fetch;
  const originalTarget = process.env.API_PROXY_TARGET;
  process.env.API_PROXY_TARGET = 'https://api.nextechsystem.com/api';
  try {
    let status = 200;
    globalThis.fetch = async (url) => {
      assert.equal(url, 'https://api.nextechsystem.com/api/products/categories');
      return Response.json(status === 200 ? { success: true, data: [] } : { success: false }, { status });
    };
    assert.deepEqual(await (await proxyTaxonomy('categories')).json(), { success: true, data: [] });
    status = 503;
    assert.equal((await proxyTaxonomy('categories')).status, 503);
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.equal((await proxyTaxonomy('brands')).status, 503);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalTarget === undefined) delete process.env.API_PROXY_TARGET;
    else process.env.API_PROXY_TARGET = originalTarget;
  }
});

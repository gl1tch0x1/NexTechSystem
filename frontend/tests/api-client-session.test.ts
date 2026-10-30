import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiClient } from '../lib/api-client';

test('old 401 cannot clear a newer session token', async (t) => {
  const savedWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const savedStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const savedFetch = globalThis.fetch;
  let storedToken: string | null = 'old-token';
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { origin: 'http://localhost:3000' } } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => storedToken,
    removeItem: () => { storedToken = null; },
  } });
  t.after(() => {
    globalThis.fetch = savedFetch;
    if (savedWindow) Object.defineProperty(globalThis, 'window', savedWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (savedStorage) Object.defineProperty(globalThis, 'localStorage', savedStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
  let complete!: (value: Response) => void;
  globalThis.fetch = () => new Promise<Response>((resolve) => { complete = resolve; });
  const request = ApiClient.get('/auth/me', { token: 'old-token' });
  storedToken = 'new-token';
  complete(Response.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Expired' } }, { status: 401 }));
  await assert.rejects(request, /Expired/);
  assert.equal(storedToken, 'new-token');

  const currentRequest = ApiClient.get('/auth/me', { token: 'new-token' });
  complete(Response.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Expired' } }, { status: 401 }));
  await assert.rejects(currentRequest, /Expired/);
  assert.equal(storedToken, null);
});

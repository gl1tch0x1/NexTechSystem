import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Run in a separate process with a disposable store and no production integrations.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nextech-workflow-'));
fs.mkdirSync(path.join(root, 'backend', 'data_store'), { recursive: true });
const env = { ...process.env };
const config = fs.readFileSync(new URL('../src/config/env.ts', import.meta.url), 'utf8');
for (const match of config.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) env[match[1]] = '';
Object.assign(env, { NODE_ENV: 'test', JWT_SECRET: 'isolated-workflow-test-key', ENABLE_MONGODB: 'false', ENABLE_FIRESTORE_SYNC: 'false', CLOUDFLARE_SECURITY_ENABLED: 'false', ALLOW_DEV_OTP: 'true', ALLOW_DEV_WEBHOOK_BYPASS: 'true' });
try {
  const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), fileURLToPath(new URL('../src/test-workflow.ts', import.meta.url))], { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  if (path.dirname(root) !== path.resolve(os.tmpdir())) throw new Error('Unexpected test workspace');
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Run in a separate process with a disposable store and no production integrations.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nextech-workflow-'));
fs.mkdirSync(path.join(root, 'backend', 'data_store'), { recursive: true });
const env = { ...process.env };
const mockEnvKeys = ['MONGODB_URI', 'DATABASE_URL', 'FIRESTORE_PROJECT_ID', 'RESEND_API_KEY', 'TABBY_SECRET_KEY', 'TAMARA_API_TOKEN', 'CLOUDFLARE_TURNSTILE_SECRET_KEY', 'ADMIN_SECRET_KEY'];
for (const k of mockEnvKeys) env[k] = '';
Object.assign(env, { NODE_ENV: 'test', JWT_SECRET: 'isolated-workflow-test-key', ENABLE_MONGODB: 'false', ENABLE_FIRESTORE_SYNC: 'false', CLOUDFLARE_SECURITY_ENABLED: 'false', ALLOW_DEV_OTP: 'true', ALLOW_DEV_WEBHOOK_BYPASS: 'true' });
try {
  const result = spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), fileURLToPath(new URL('../src/test-workflow.ts', import.meta.url))], { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  if (path.dirname(root) !== path.resolve(os.tmpdir())) throw new Error('Unexpected test workspace');
  fs.rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

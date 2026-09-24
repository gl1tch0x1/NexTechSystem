import crypto from 'crypto';
import { ENV } from '../config/env.js';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  return `${salt}:${crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')}`;
}

export function verifyPassword(candidate: string, stored: string): boolean {
  if (!stored) return false;
  const separator = stored.indexOf(':');
  const salt = separator === -1 ? ENV.PASSWORD_SALT : stored.slice(0, separator);
  const expected = separator === -1 ? stored : stored.slice(separator + 1);
  if (!salt || !/^[a-f0-9]{128}$/i.test(expected)) return false;
  const actual = crypto.pbkdf2Sync(candidate, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return crypto.timingSafeEqual(actual, expectedBuffer);
}

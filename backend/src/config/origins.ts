import { ENV } from './env.js';

/** Exact origin matching: never trust arbitrary Vercel projects or hostname substrings. */
export function isAllowedOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    return ENV.ALLOWED_ORIGINS.some(allowed => {
      try {
        return new URL(allowed).origin === url.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

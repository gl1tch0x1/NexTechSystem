import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Endpoints that authenticate via cryptographic HMAC / signature, pre-auth verification, or public account onboarding
const CSRF_EXEMPT_PATHS = [
  '/api/payments/tamara/webhook',
  '/api/payments/tabby/webhook',
  '/api/security/turnstile/verify',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-reset-otp',
];

function isOriginAllowed(originOrReferer: string): boolean {
  try {
    const parsed = new URL(originOrReferer);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'nextechsystem.com' ||
      host.endsWith('.nextechsystem.com') ||
      host.endsWith('.vercel.app')
    ) {
      return true;
    }
    return ENV.ALLOWED_ORIGINS.some(allowed => {
      try {
        return new URL(allowed).origin === parsed.origin;
      } catch {
        return allowed === originOrReferer;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Enterprise CSRF & Cross-Origin State-Change Guard (OWASP A01 / CWE-352)
 * Validates Origin and Referer headers on all mutating state operations
 * to prevent unauthorized cross-origin forged actions.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe read-only methods don't alter state
  if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  // Exempt webhooks, public auth, and third-party signed callbacks
  const currentPath = req.originalUrl.split('?')[0];
  if (CSRF_EXEMPT_PATHS.some(p => currentPath === p || currentPath.endsWith(p))) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // 1. Origin Header Validation
  if (origin) {
    if (!isOriginAllowed(origin)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_ORIGIN_FORBIDDEN',
          message: 'Cross-Site Request Forgery blocked: Request origin is not permitted.',
        },
      });
      return;
    }
    return next();
  }

  // 2. Referer Header Validation (fallback when Origin is not sent)
  if (referer) {
    if (!isOriginAllowed(referer)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_REFERER_FORBIDDEN',
          message: 'Cross-Site Request Forgery blocked: Request referer is not permitted.',
        },
      });
      return;
    }
    return next();
  }

  // 3. Headerless Requests (server-to-server proxies, API clients)
  // CSRF exclusively exploits ambient credentials (cookies) in web browsers.
  // Requests without cookies or with an Authorization Bearer header cannot be forged via browser CSRF.
  const hasCookies = Boolean(req.headers.cookie);
  const authHeader = req.headers.authorization;

  if (authHeader || !hasCookies) {
    return next();
  }

  res.status(403).json({
    success: false,
    error: {
      code: 'CSRF_MISSING_ORIGIN',
      message: 'Cross-Site Request Forgery blocked: Origin verification headers required.',
    },
  });
}

/**
 * Generates and sets a secure CSRF token cookie for the client
 */
export function setCsrfCookie(res: Response): string {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('csrf_token', token, {
    httpOnly: false, // Accessible by JavaScript to read and mirror in X-CSRF-Token header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400000, // 24 hours
  });
  return token;
}

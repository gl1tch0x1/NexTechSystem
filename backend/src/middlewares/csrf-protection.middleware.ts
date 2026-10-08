import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Endpoints that authenticate via cryptographic HMAC / signature or pre-auth verification
const CSRF_EXEMPT_PATHS = [
  '/api/payments/tamara/webhook',
  '/api/payments/tabby/webhook',
  '/api/security/turnstile/verify',
];

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

  // Exempt webhooks and third-party signed callbacks
  const currentPath = req.originalUrl.split('?')[0];
  if (CSRF_EXEMPT_PATHS.some(p => currentPath === p || currentPath.endsWith(p))) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // 1. Origin Header Validation
  if (origin) {
    const isAllowed = ENV.ALLOWED_ORIGINS.some(allowed => {
      try {
        return new URL(allowed).origin === new URL(origin).origin;
      } catch {
        return allowed === origin;
      }
    });

    if (!isAllowed) {
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
    try {
      const refererOrigin = new URL(referer).origin;
      const isAllowed = ENV.ALLOWED_ORIGINS.some(allowed => {
        try {
          return new URL(allowed).origin === refererOrigin;
        } catch {
          return allowed === refererOrigin;
        }
      });

      if (!isAllowed) {
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
    } catch {
      res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_MALFORMED_REFERER',
          message: 'Cross-Site Request Forgery blocked: Malformed referer header.',
        },
      });
      return;
    }
  }

  // In production, mutating requests without Origin or Referer from browser are blocked
  if (process.env.NODE_ENV === 'production') {
    // If an Authorization Bearer header is present, it is an explicit programmatic API request
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_MISSING_ORIGIN',
        message: 'Cross-Site Request Forgery blocked: Origin verification headers required.',
      },
    });
    return;
  }

  next();
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

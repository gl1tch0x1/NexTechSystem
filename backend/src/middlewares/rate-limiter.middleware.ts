import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import { Request } from 'express';
import { getClientIp } from './cloudflare-security.middleware.js';

const isDevOrTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV !== 'production';

/**
 * Standard key generator utilizing Cloudflare real client IP
 */
const customKeyGenerator = (req: Request): string => {
  return getClientIp(req);
};

const isLocalhost = (req: Request): boolean => {
  const ip = getClientIp(req);
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
};

/**
 * Global REST API rate limiter
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevOrTest ? 50000 : 300,
  skip: (req) => isDevOrTest && isLocalhost(req),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'API_RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests from this IP. Please try again after 15 minutes.',
    },
  },
});

/**
 * Authentication & Identity rate limiter
 * Prevents credential stuffing, brute-force login, and registration spam
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevOrTest ? 10000 : 60,
  skip: (req) => isDevOrTest && isLocalhost(req),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

/**
 * Digital Wallet & Financial Transactions rate limiter
 * Protects balance queries, add-funds, and ledger modifications
 */
export const walletLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevOrTest ? 10000 : 60,
  skip: (req) => isDevOrTest && isLocalhost(req),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'WALLET_RATE_LIMIT_EXCEEDED',
      message: 'Too many wallet transactions requested from this client. Please try again later.',
    },
  },
});

/**
 * Security Challenge & Turnstile Verification rate limiter
 * Protects anti-bot verification and edge status endpoints
 */
export const securityLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevOrTest ? 10000 : 100,
  skip: (req) => isDevOrTest && isLocalhost(req),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'SECURITY_RATE_LIMIT_EXCEEDED',
      message: 'Too many security challenge verifications requested. Please try again later.',
    },
  },
});

/**
 * Order Placement & Checkout rate limiter
 */
export const orderLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevOrTest ? 10000 : 100,
  skip: (req) => isDevOrTest && isLocalhost(req),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'ORDER_RATE_LIMIT_EXCEEDED',
      message: 'Too many orders processed from this client. Please try again later.',
    },
  },
});

/**
 * Reseller Multi-Tenant Portal Operations rate limiter
 */
export const resellerLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevOrTest ? 10000 : 200,
  skip: (req) => isDevOrTest && isLocalhost(req),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'RESELLER_RATE_LIMIT_EXCEEDED',
      message: 'Too many reseller portal requests from this client. Please try again later.',
    },
  },
});

/**
 * Enterprise Administration rate limiter
 */
export const adminLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: isDevOrTest ? 10000 : 300,
  skip: (req) => isDevOrTest && isLocalhost(req),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'ADMIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many admin operations executed. Please try again later.',
    },
  },
});

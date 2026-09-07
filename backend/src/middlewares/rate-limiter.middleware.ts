import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit';
import { Request } from 'express';
import { getClientIp } from './cloudflare-security.middleware.js';

/**
 * Standard key generator utilizing Cloudflare real client IP
 */
const customKeyGenerator = (req: Request): string => {
  return getClientIp(req);
};

/**
 * Global REST API rate limiter
 * Allows 300 requests per 15 minutes window
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'test' ? 10000 : 300,
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
  limit: process.env.NODE_ENV === 'test' ? 5000 : 60,
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
  limit: process.env.NODE_ENV === 'test' ? 5000 : 60,
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
  limit: process.env.NODE_ENV === 'test' ? 5000 : 100,
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
  limit: process.env.NODE_ENV === 'test' ? 5000 : 100,
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
  limit: process.env.NODE_ENV === 'test' ? 5000 : 200,
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
  limit: process.env.NODE_ENV === 'test' ? 5000 : 300,
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

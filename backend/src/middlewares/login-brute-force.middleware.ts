import { Request, Response, NextFunction } from 'express';
import { getClientIp } from './cloudflare-security.middleware.js';
import { auditService } from '../services/audit.service.js';

interface IpAttemptRecord {
  failedCount: number;
  firstFailedAt: number;
  blockedUntil: number;
  lastAttemptAt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30-minute lockout

const ipAttempts = new Map<string, IpAttemptRecord>();

// Periodic cleanup of stale tracking entries every 10 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipAttempts.entries()) {
    if (record.blockedUntil < now && now - record.lastAttemptAt > ATTEMPT_WINDOW_MS * 2) {
      ipAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Check whether a client IP is currently blocked due to brute-force attempts
 */
export function isIpBlocked(ip: string): { blocked: boolean; remainingSeconds: number } {
  const record = ipAttempts.get(ip);
  if (!record || record.blockedUntil <= Date.now()) {
    return { blocked: false, remainingSeconds: 0 };
  }
  const remainingSeconds = Math.max(1, Math.ceil((record.blockedUntil - Date.now()) / 1000));
  return { blocked: true, remainingSeconds };
}

/**
 * Express middleware to block incoming login requests from blacklisted/locked IPs
 */
export function loginBruteForceGuard(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const status = isIpBlocked(ip);

  if (status.blocked) {
    const remainingMinutes = Math.max(1, Math.ceil(status.remainingSeconds / 60));
    res.status(429).json({
      success: false,
      error: {
        code: 'IP_BLOCKED_BRUTE_FORCE',
        message: `Access denied: Your IP address has been temporarily blocked due to multiple failed login attempts. Potential brute-force attack detected. Please try again after ${remainingMinutes} minutes.`,
        retryAfter: status.remainingSeconds,
      },
    });
    return;
  }

  next();
}

/**
 * Record a failed authentication attempt against a client IP.
 * Triggers an IP lockout when threshold is reached.
 */
export function recordFailedLogin(
  ip: string,
  emailOrUser?: string
): { isBlocked: boolean; remainingAttempts: number; remainingSeconds?: number } {
  const now = Date.now();
  let record = ipAttempts.get(ip);

  if (!record || now - record.firstFailedAt > ATTEMPT_WINDOW_MS) {
    record = {
      failedCount: 1,
      firstFailedAt: now,
      blockedUntil: 0,
      lastAttemptAt: now,
    };
  } else {
    record.failedCount += 1;
    record.lastAttemptAt = now;
  }

  if (record.failedCount >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    ipAttempts.set(ip, record);

    auditService.log({
      userId: 'system',
      userEmail: emailOrUser || 'unauthenticated@intruder',
      userRole: 'CUSTOMER',
      action: 'IP_BRUTE_FORCE_BLOCKED',
      resource: 'auth/login',
      details: {
        ipAddress: ip,
        failedAttempts: record.failedCount,
        blockedUntil: new Date(record.blockedUntil).toISOString(),
        blockDurationMinutes: 30,
      },
    });

    return {
      isBlocked: true,
      remainingAttempts: 0,
      remainingSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
    };
  }

  ipAttempts.set(ip, record);
  return {
    isBlocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.failedCount,
  };
}

/**
 * Reset failed attempts on a successful authentication
 */
export function recordSuccessfulLogin(ip: string): void {
  ipAttempts.delete(ip);
}

/**
 * Clear IP attempts (used for testing and administrative resets)
 */
export function resetIpAttempts(ip?: string): void {
  if (ip) {
    ipAttempts.delete(ip);
  } else {
    ipAttempts.clear();
  }
}

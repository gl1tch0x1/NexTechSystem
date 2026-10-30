import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID as uuidv4 } from 'crypto';
import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { walletService } from '../services/wallet.service.js';
import { ENV } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, Reseller } from '../types/index.js';
import { passwordResetService } from '../services/password-reset.service.js';
import { auditService } from '../services/audit.service.js';
import { getFirebaseAuth } from '../config/firebase.js';
import { dbStore } from '../config/db-store.js';

// In-memory failed login tracking for brute-force defense
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

/**
 * Generate a secure, per-user random salt for password hashing.
 * Returns hex-encoded 32-byte salt.
 */
function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a password with PBKDF2 using a per-user salt.
 * Stores as "<salt>:<hash>" to keep the salt co-located with the hash.
 * The legacy global-salt format (64-char hex without a colon) is handled transparently
 * via verifyPassword() to allow existing users to log in and get their hash upgraded.
 */
function hashPassword(password: string, salt?: string): string {
  const effectiveSalt = salt || generateSalt();
  const hash = crypto.pbkdf2Sync(password, effectiveSalt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return `${effectiveSalt}:${hash}`;
}

/**
 * Verify a candidate password against a stored hash.
 * Supports both the new "salt:hash" format and the legacy global-salt format
 * to enable zero-downtime migration of existing accounts.
 */
function verifyPassword(candidate: string, stored: string): boolean {
  if (!stored) return false;

  if (stored.includes(':')) {
    // New format: "<salt>:<hash>"
    const colonIdx = stored.indexOf(':');
    const salt = stored.slice(0, colonIdx);
    const expectedHash = stored.slice(colonIdx + 1);
    const candidateHash = crypto.pbkdf2Sync(candidate, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    const storedBuf = Buffer.from(expectedHash, 'hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    return storedBuf.length === candidateBuf.length && crypto.timingSafeEqual(storedBuf, candidateBuf);
  } else {
    // Legacy format: global static salt (migration path)
    const legacySalt = ENV.PASSWORD_SALT || '';
    const candidateHash = crypto.pbkdf2Sync(candidate, legacySalt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    const storedBuf = Buffer.from(stored, 'hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    return storedBuf.length === candidateBuf.length && crypto.timingSafeEqual(storedBuf, candidateBuf);
  }
}

function sanitizeUser(user: User): User {
  const { passwordHash, adminPinHash, mfaSecret, mfaBackupCodes, ...safeUser } = user;
  return safeUser as User;
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    const idx = alphabet.indexOf(input[i].toUpperCase());
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function verifyTotp(secret: string, token: string, window = 1): boolean {
  if (!secret || !token || !/^\d{6}$/.test(token.trim())) return false;
  const key = base32Decode(secret);
  if (key.length === 0) return false;
  const currentTime = Math.floor(Date.now() / 1000 / 30);
  const targetCode = parseInt(token.trim(), 10);

  for (let step = -window; step <= window; step++) {
    const timeStep = currentTime + step;
    const timeBuf = Buffer.alloc(8);
    timeBuf.writeBigUInt64BE(BigInt(timeStep));

    const hmac = crypto.createHmac('sha1', key).update(timeBuf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const otp = binary % 1000000;

    if (otp === targetCode) {
      return true;
    }
  }
  return false;
}

function generateBackupCodes(count = 8): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    plainCodes.push(formatted);
    hashedCodes.push(crypto.createHash('sha256').update(formatted).digest('hex'));
  }
  return { plainCodes, hashedCodes };
}

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const {
      accountType,
      role: requestedRole,
      name,
      email,
      username,
      phone,
      address,
      password,
      // Professional Reseller fields
      businessName,
      tradeLicense,
      taxNumber,
      taxRegistrationNumber,
      licenseJurisdiction,
      businessType,
      signatoryTitle,
      website,
      resellerCode,
      addressStreet,
      addressCity,
      settlementTerms,
      dispatchHub,
      description,
    } = req.body;

    const isReseller = (accountType === 'RESELLER' || requestedRole === 'RESELLER');

    if (!email || !name || !password) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Name, Email, and Password are required.' } });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = String(name).trim();

    // Email format validation (linear time O(n) without nested quantifier backtracking)
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 254) {
      res.status(400).json({ success: false, error: { code: 'INVALID_EMAIL', message: 'A valid email address is required.' } });
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      res.status(400).json({ success: false, error: { code: 'INVALID_NAME', message: 'Name must be between 2 and 100 characters.' } });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long.' } });
      return;
    }

    if (password.length > 128) {
      res.status(400).json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Password must not exceed 128 characters.' } });
      return;
    }

    const existing = await userRepository.findByEmail(cleanEmail);
    if (existing) {
      res.status(400).json({ success: false, error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists.' } });
      return;
    }

    const passwordHash = hashPassword(password);
    const userId = `user_${uuidv4()}`;

    // =========================================================================
    // 1. ENTERPRISE RESELLER ACCOUNT CREATION
    // Requires comprehensive professional registration details
    // =========================================================================
    if (isReseller) {
      const cleanBusinessName = String(businessName || '').trim();
      const cleanTradeLicense = String(tradeLicense || '').trim();
      const effectiveTaxNumber = String(taxNumber || taxRegistrationNumber || '').trim();

      if (!cleanBusinessName) {
        res.status(400).json({ success: false, error: { code: 'MISSING_BUSINESS_NAME', message: 'Corporate legal business name is required for reseller registration.' } });
        return;
      }

      if (!cleanTradeLicense) {
        res.status(400).json({ success: false, error: { code: 'MISSING_TRADE_LICENSE', message: 'Official Commercial Trade License number is required for reseller registration.' } });
        return;
      }

      // Generate or clean reseller code
      let candidateCode = resellerCode
        ? String(resellerCode).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
        : cleanBusinessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);

      if (!candidateCode || candidateCode.length < 3) {
        candidateCode = `res_${cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 15)}`;
      }

      // Check if reseller code already taken
      const existingReseller = await resellerRepository.findByCode(candidateCode);
      if (existingReseller) {
        const secureSuffix = crypto.randomInt(100, 1000);
        candidateCode = `${candidateCode}${secureSuffix}`;
      }

      const resellerId = `res_${uuidv4()}`;
      const cleanUsername = username
        ? String(username).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
        : candidateCode;

      const resellerAddress = {
        id: `addr_${uuidv4()}`,
        fullName: cleanName,
        phone: phone ? String(phone).trim() : '',
        addressLine1: addressStreet ? String(addressStreet).trim() : (address?.addressLine1 || 'Commercial Business Bay'),
        addressLine2: address?.addressLine2 || '',
        city: addressCity ? String(addressCity).trim() : (address?.city || 'Dubai'),
        state: addressCity ? String(addressCity).trim() : (address?.state || 'Dubai'),
        country: address?.country || 'United Arab Emirates',
        postalCode: address?.postalCode || '00000',
        isDefaultShipping: true,
        isDefaultBilling: true,
      };

      const newUser: User = {
        id: userId,
        email: cleanEmail,
        role: 'RESELLER',
        resellerId: resellerId,
        company: cleanBusinessName,
        tradeLicense: cleanTradeLicense,
        taxRegistrationNumber: effectiveTaxNumber,
        name: cleanName,
        username: cleanUsername,
        phone: phone ? String(phone).trim().slice(0, 30) : '',
        addresses: [resellerAddress],
        passwordHash,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newReseller: Reseller = {
        id: resellerId,
        userId: userId,
        resellerCode: candidateCode,
        username: cleanUsername,
        email: cleanEmail,
        businessName: cleanBusinessName,
        displayName: cleanBusinessName,
        phone: phone ? String(phone).trim() : '',
        subdomain: candidateCode,
        address: resellerAddress,
        businessInformation: {
          taxNumber: effectiveTaxNumber,
          tradeLicense: cleanTradeLicense,
          licenseJurisdiction: licenseJurisdiction ? String(licenseJurisdiction).trim() : 'Dubai Economy and Tourism (DET)',
          businessType: businessType ? String(businessType).trim() : 'IT Solutions & Hardware Distributor',
          authorizedSignatory: cleanName,
          signatoryTitle: signatoryTitle ? String(signatoryTitle).trim() : 'Managing Director',
          website: website ? String(website).trim() : '',
          settlementTerms: settlementTerms ? String(settlementTerms).trim() : 'Net 30 Days Commercial',
          dispatchHub: dispatchHub ? String(dispatchHub).trim() : 'Dubai Logistics City (DWC)',
          description: description ? String(description).trim() : `Verified Enterprise Reseller Partner: ${cleanBusinessName}`,
        },
        status: 'ACTIVE',
        productCount: 0,
        salesStats: {
          totalRevenue: 0,
          totalOrders: 0,
          unitsSold: 0,
        },
        commissionRate: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userRepository.create(newUser);
      await resellerRepository.create(newReseller);
      await walletService.getOrCreateWallet(userId);

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role, resellerId },
        ENV.JWT_SECRET,
        { expiresIn: '30d' }
      );

      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        data: {
          token,
          user: sanitizeUser(newUser),
          reseller: newReseller,
        },
      });
      return;
    }

    // =========================================================================
    // 2. STANDARD CUSTOMER ACCOUNT CREATION
    // Zero-friction registration ("just have to create the account - nothing else")
    // =========================================================================
    const cleanUsername = username
      ? String(username).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
      : cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 30);

    // Public registration cannot grant administrative access, including on an empty store.
    const assignedRole = 'CUSTOMER' as const;

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      role: assignedRole,
      name: cleanName,
      username: cleanUsername,
      phone: phone ? String(phone).trim().slice(0, 20) : '',
      addresses: address ? [{ ...address, id: `addr_${uuidv4()}`, isDefaultShipping: true, isDefaultBilling: true }] : [],
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userRepository.create(newUser);
    await walletService.getOrCreateWallet(userId);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: sanitizeUser(newUser),
      },
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password, resellerCode } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Email / Username and Password are required.' } });
      return;
    }

    const cleanIdentifier = String(email).trim().toLowerCase();
    let user = await userRepository.findByEmail(cleanIdentifier);
    if (!user) {
      user = await userRepository.findByUsername(cleanIdentifier);
    }

    if (!user) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated. Please contact support.' } });
      return;
    }

    // Check brute-force lockout
    const lockKey = cleanIdentifier;
    const lockRecord = failedLoginAttempts.get(lockKey);
    if (lockRecord && lockRecord.lockedUntil > Date.now()) {
      const waitSeconds = Math.ceil((lockRecord.lockedUntil - Date.now()) / 1000);
      res.status(429).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: `Too many failed login attempts. Please try again in ${waitSeconds} seconds.`,
        },
      });
      return;
    }

    // Verify password against stored hash in the database
    const rawPassword = String(password);
    const trimmedPassword = rawPassword.trim();
    const candidatePasswords = [rawPassword];
    if (trimmedPassword !== rawPassword) {
      candidatePasswords.push(trimmedPassword);
    }

    let isValid = false;
    let needsRehash = false;

    if (user.passwordHash) {
      for (const pwd of candidatePasswords) {
        if (verifyPassword(pwd, user.passwordHash)) {
          isValid = true;
          // If user is on legacy global-salt format, schedule rehash to new per-user-salt format
          if (!user.passwordHash.includes(':')) {
            needsRehash = true;
          }
          break;
        }
      }
    }

    if (!isValid) {
      const currentAttempts = (lockRecord?.count || 0) + 1;
      if (currentAttempts >= 5) {
        failedLoginAttempts.set(lockKey, { count: currentAttempts, lockedUntil: Date.now() + 15 * 60 * 1000 });
      } else {
        failedLoginAttempts.set(lockKey, { count: currentAttempts, lockedUntil: 0 });
      }
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
      return;
    }

    // Reset failed attempts on successful authentication
    failedLoginAttempts.delete(lockKey);


    // If logging into a Reseller Subdomain, verify resellerCode match
    if (user.role === 'RESELLER' && resellerCode) {
      const reseller = await resellerRepository.findById(user.resellerId || '');
      if (!reseller || reseller.resellerCode.toLowerCase() !== resellerCode.toLowerCase()) {
        res.status(403).json({
          success: false,
          error: { code: 'SUBDOMAIN_MISMATCH', message: 'This reseller account does not belong to this portal.' },
        });
        return;
      }
      if (reseller.status !== 'ACTIVE') {
        res.status(403).json({
          success: false,
          error: { code: 'RESELLER_NOT_ACTIVE', message: `Reseller status is currently: ${reseller.status}` },
        });
        return;
      }
    }

    const loginUpdate: any = { lastLoginAt: new Date().toISOString() };
    // Privileges come from the stored account, never a caller-selectable username.
    // Transparently migrate legacy global-salt hashes to per-user-salt format on next login
    if (needsRehash) {
      loginUpdate.passwordHash = hashPassword(candidatePasswords[0]);
    }
    await userRepository.update(user.id, loginUpdate);

    // Multi-factor authentication enforcement
    if (user.mfaEnabled) {
      const { mfaCode } = req.body;
      if (!mfaCode) {
        const mfaTicket = jwt.sign(
          { id: user.id, email: user.email, mfaPending: true },
          ENV.JWT_SECRET,
          { expiresIn: '5m' }
        );
        res.json({
          success: true,
          data: {
            requiresMfa: true,
            mfaTicket,
          },
        });
        return;
      }

      const cleanMfaCode = String(mfaCode).trim();
      let mfaPassed = false;
      if (user.mfaSecret && verifyTotp(user.mfaSecret, cleanMfaCode)) {
        mfaPassed = true;
      } else if (user.mfaBackupCodes && Array.isArray(user.mfaBackupCodes)) {
        const hashedCandidate = crypto.createHash('sha256').update(cleanMfaCode).digest('hex');
        const idx = user.mfaBackupCodes.indexOf(hashedCandidate);
        if (idx !== -1) {
          mfaPassed = true;
          const updatedCodes = [...user.mfaBackupCodes];
          updatedCodes.splice(idx, 1);
          await userRepository.update(user.id, { mfaBackupCodes: updatedCodes });
        }
      }

      if (!mfaPassed) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_MFA_CODE', message: 'Invalid multi-factor authentication code or backup recovery code.' },
        });
        return;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, resellerId: user.resellerId },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

    setAuthCookie(res, token);

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User record not found.' } });
      return;
    }

    let resellerData = null;
    if (user.role === 'RESELLER' && user.resellerId) {
      resellerData = await resellerRepository.findById(user.resellerId);
    }

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        reseller: resellerData,
      },
    });
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { name, phone, addresses } = req.body;
    const updated = await userRepository.update(req.user.id, {
      name: name ? String(name).trim().slice(0, 100) : undefined,
      phone: phone ? String(phone).trim().slice(0, 20) : undefined,
      addresses: Array.isArray(addresses) ? addresses : undefined,
    });

    // Never return the passwordHash in profile responses
    res.json({
      success: true,
      data: updated ? sanitizeUser(updated as User) : null,
    });
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'New password must be at least 8 characters long.' },
      });
      return;
    }

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User account not found.' } });
      return;
    }

    // If user has a password set, require verifying current password
    if (user.passwordHash) {
      if (!currentPassword || typeof currentPassword !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Current password is required.' },
        });
        return;
      }

      const isValid = verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Current password does not match.' },
        });
        return;
      }
    }

    const newHash = hashPassword(newPassword);
    await userRepository.update(user.id, {
      passwordHash: newHash,
      passwordChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Password has been updated successfully.',
    });
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { password, confirmation } = req.body || {};
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User account not found.' } });
      return;
    }

    // Require password re-authentication for local password accounts
    if (user.passwordHash) {
      if (!password || typeof password !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'PASSWORD_REQUIRED', message: 'Current password is required to delete this account.' },
        });
        return;
      }

      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect password provided for deletion.' },
        });
        return;
      }
    } else {
      // For federated OAuth accounts without a password hash (e.g. Google Sign-in)
      if (confirmation !== 'DELETE') {
        res.status(400).json({
          success: false,
          error: { code: 'CONFIRMATION_REQUIRED', message: 'Please type DELETE to confirm permanent account deletion.' },
        });
        return;
      }
    }

    // Permanently remove the user
    await userRepository.delete(user.id);

    // If reseller record exists, update reseller status to SUSPENDED
    if (user.resellerId) {
      try {
        await resellerRepository.update(user.resellerId, { status: 'SUSPENDED' });
      } catch {
        // Continue
      }
    }

    res.json({
      success: true,
      message: 'Account has been permanently deleted.',
    });
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Cryptographically signed Google/Firebase ID token is required.' },
      });
      return;
    }

    let decoded: any;
    try {
      const auth = getFirebaseAuth();
      decoded = await auth.verifyIdToken(idToken);
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_ID_TOKEN', message: 'Google authentication token verification failed or expired.' },
      });
      return;
    }

    if (!decoded || !decoded.email || !decoded.email_verified) {
      res.status(403).json({
        success: false,
        error: { code: 'UNVERIFIED_EMAIL', message: 'Google account email must be verified.' },
      });
      return;
    }

    const cleanEmail = String(decoded.email).toLowerCase().trim();
    let user = await userRepository.findByEmail(cleanEmail);

    if (user && user.role === 'ADMIN') {
      res.status(403).json({
        success: false,
        error: { code: 'ADMIN_AUTH_REQUIRED', message: 'Administrative accounts must authenticate via dedicated admin credentials and MFA.' },
      });
      return;
    }

    if (!user) {
      const userId = `user_${uuidv4()}`;
      const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');

      user = {
        id: userId,
        email: cleanEmail,
        role: 'CUSTOMER',
        name: decoded.name ? String(decoded.name).trim() : cleanEmail.split('@')[0],
        username: cleanUsername,
        phone: '',
        addresses: [],
        avatar: decoded.picture || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userRepository.create(user);
      await walletService.getOrCreateWallet(userId);
    } else {
      if (!user.isActive) {
        res.status(403).json({ success: false, error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated. Please contact support.' } });
        return;
      }
      await userRepository.update(user.id, { lastLoginAt: new Date().toISOString() });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, resellerId: user.resellerId },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

    setAuthCookie(res, token);

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  }

  async setupMfa(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const secret = generateTotpSecret();
    const { plainCodes, hashedCodes } = generateBackupCodes();

    // Temporarily save secret and backup codes on user record until verified
    await userRepository.update(req.user.id, {
      mfaSecret: secret,
      mfaBackupCodes: hashedCodes,
    });

    const otpauthUrl = `otpauth://totp/NexTech:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=NexTech`;

    res.json({
      success: true,
      data: {
        secret,
        otpauthUrl,
        backupCodes: plainCodes,
      },
    });
  }

  async verifyAndEnableMfa(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Verification code is required.' } });
      return;
    }

    const user = await userRepository.findById(req.user.id);
    if (!user || !user.mfaSecret) {
      res.status(400).json({ success: false, error: { code: 'MFA_NOT_INITIALIZED', message: 'Please initialize MFA setup first.' } });
      return;
    }

    if (!verifyTotp(user.mfaSecret, String(code).trim())) {
      res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid verification code.' } });
      return;
    }

    await userRepository.update(user.id, { mfaEnabled: true });

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully.',
    });
  }

  async disableMfa(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } });
      return;
    }

    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'PASSWORD_REQUIRED', message: 'Current account password is required to disable 2FA.' },
      });
      return;
    }

    const user = await userRepository.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
      return;
    }

    if (!user.passwordHash || !verifyPassword(String(password), user.passwordHash)) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid password.' },
      });
      return;
    }

    await userRepository.update(user.id, {
      mfaEnabled: false,
      mfaSecret: undefined,
      mfaBackupCodes: undefined,
    });

    res.json({
      success: true,
      message: 'Two-factor authentication has been disabled.',
    });
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  }

  /**
   * Request password reset 6-digit OTP
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'A valid email address is required.' },
      });
      return;
    }

    try {
      const result = await passwordResetService.requestResetOtp(email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch {
      // Uniform response preventing user enumeration oracles (OWASP A07 Defense)
      res.status(200).json({
        success: true,
        data: {
          success: true,
          message: 'If an account exists with this email address, a verification code has been dispatched.',
        },
      });
    }
  }

  /**
   * Validate password reset 6-digit OTP and issue single-use resetToken
   */
  async verifyResetOtp(req: Request, res: Response): Promise<void> {
    const { email, code } = req.body;
    if (!email || !code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and 6-digit verification code are required.' },
      });
      return;
    }

    const result = await passwordResetService.verifyResetOtp(String(email), String(code));
    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: result.error || 'Invalid or expired verification code.',
          remainingAttempts: result.remainingAttempts,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        resetToken: result.resetToken,
        message: 'Verification code confirmed. You may now set your new password.',
      },
    });
  }

  /**
   * Set new password with validated resetToken
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || typeof resetToken !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'TOKEN_REQUIRED', message: 'Password reset authorization token is required.' },
      });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 8 characters long.' },
      });
      return;
    }

    if (newPassword.length > 128) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Password must not exceed 128 characters.' },
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, ENV.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_RESET_TOKEN', message: 'The reset authorization token has expired or is invalid. Please request a new code.' },
      });
      return;
    }

    if (decoded.purpose !== 'PASSWORD_RESET' || !decoded.userId || !decoded.otpId) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN_PURPOSE', message: 'Invalid authorization token.' },
      });
      return;
    }

    // Verify token single-use against database
    const otpRecord = await dbStore.findById<any>('password_reset_otps', decoded.otpId);
    if (!otpRecord || otpRecord.usedForReset) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_ALREADY_USED', message: 'This password reset token has already been consumed or revoked.' },
      });
      return;
    }

    await dbStore.update('password_reset_otps', decoded.otpId, {
      usedForReset: true,
      consumed: true,
    });

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Account not found or inactive.' },
      });
      return;
    }

    const newPasswordHash = hashPassword(newPassword);
    await userRepository.update(user.id, {
      passwordHash: newPasswordHash,
      passwordChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PASSWORD_RESET_SUCCESS',
      resource: 'auth/reset-password',
      details: {
        timestamp: new Date().toISOString(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.',
    });
  }
}

export const authController = new AuthController();
export { hashPassword, verifyPassword, sanitizeUser };

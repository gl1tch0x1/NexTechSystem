import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { walletService } from '../services/wallet.service.js';
import { ENV } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User, Reseller } from '../types/index.js';

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
    const legacySalt = ENV.PASSWORD_SALT || 'nextech_enterprise_salt_v2_2026';
    const candidateHash = crypto.pbkdf2Sync(candidate, legacySalt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    const storedBuf = Buffer.from(stored, 'hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    return storedBuf.length === candidateBuf.length && crypto.timingSafeEqual(storedBuf, candidateBuf);
  }
}

function sanitizeUser(user: User): User {
  const { passwordHash, ...safeUser } = user;
  return safeUser as User;
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
      creditLimitAED,
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

    // Email format validation (RFC 5322 simplified)
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
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
          settlementTerms: settlementTerms ? String(settlementTerms).trim() : 'Net 30 Days (Corporate Credit)',
          creditLimitAED: creditLimitAED ? Number(creditLimitAED) : 50000,
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

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      role: 'CUSTOMER',
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
        const isBootstrapAdmin =
          Boolean(ENV.ADMIN_BOOTSTRAP_PASSWORD) &&
          user.role === 'ADMIN' &&
          (ENV.ADMIN_BOOTSTRAP_EMAIL ? user.email.toLowerCase() === ENV.ADMIN_BOOTSTRAP_EMAIL.toLowerCase() : true) &&
          pwd === ENV.ADMIN_BOOTSTRAP_PASSWORD;

        if (verifyPassword(pwd, user.passwordHash) || isBootstrapAdmin) {
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
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
      return;
    }


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
    // Transparently migrate legacy global-salt hashes to per-user-salt format on next login
    if (needsRehash) {
      loginUpdate.passwordHash = hashPassword(candidatePasswords[0]);
    }
    await userRepository.update(user.id, loginUpdate);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, resellerId: user.resellerId },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

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

    // Require either correct password or confirmation phrase "DELETE"
    if (user.passwordHash && password) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect password provided for deletion.' },
        });
        return;
      }
    } else if (confirmation !== 'DELETE') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Please enter your password or type DELETE to confirm deletion.' },
      });
      return;
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
    const { email, name, photoURL } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Google account email is required.' } });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await userRepository.findByEmail(cleanEmail);

    if (!user) {
      // Any new account created via Google is strictly a CUSTOMER
      const userId = `user_${uuidv4()}`;
      const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '');

      user = {
        id: userId,
        email: cleanEmail,
        role: 'CUSTOMER',
        name: name ? name.trim() : cleanEmail.split('@')[0],
        username: cleanUsername,
        phone: '',
        addresses: [],
        avatar: photoURL || undefined,
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

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  }
}

export const authController = new AuthController();
export { hashPassword, verifyPassword, sanitizeUser };

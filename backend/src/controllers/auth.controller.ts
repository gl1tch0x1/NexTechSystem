import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../repositories/user.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { walletService } from '../services/wallet.service.js';
import { auditService } from '../services/audit.service.js';
import { ENV } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../types/index.js';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, username, phone, address } = req.body;

    if (!email || !name) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Email and Name are required.' } });
      return;
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      res.status(400).json({ success: false, error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists.' } });
      return;
    }

    const userId = `user_${uuidv4()}`;
    const cleanUsername = username ? username.toLowerCase().replace(/[^a-z0-9_]/g, '') : email.split('@')[0];

    const newUser: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      role: 'CUSTOMER',
      name: name.trim(),
      username: cleanUsername,
      phone: phone || '',
      addresses: address ? [{ ...address, id: `addr_${uuidv4()}`, isDefaultShipping: true, isDefaultBilling: true }] : [],
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
        user: newUser,
      },
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password, roleHint, resellerCode } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Email / Username is required.' } });
      return;
    }

    let user = await userRepository.findByEmail(email);
    if (!user) {
      user = await userRepository.findByUsername(email);
    }

    if (!user) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated. Please contact support.' } });
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

    await userRepository.update(user.id, { lastLoginAt: new Date().toISOString() });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, resellerId: user.resellerId },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user,
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
        user,
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
      name: name || undefined,
      phone: phone || undefined,
      addresses: addresses || undefined,
    });

    res.json({
      success: true,
      data: updated,
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
        user,
      },
    });
  }
}

export const authController = new AuthController();

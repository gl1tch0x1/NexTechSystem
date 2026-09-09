import { Request, Response } from 'express';
import { pcBuilderService } from '../services/pc-builder.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { walletService } from '../services/wallet.service.js';
import { verifyAdminPin, DEFAULT_SYSTEM_ADMIN_PIN_HASH } from '../utils/admin-pin.js';

export class PCBuilderController {
  async getComponents(req: Request, res: Response): Promise<void> {
    const components = await pcBuilderService.getComponentsByCategory();
    res.json({ success: true, data: components });
  }

  async validateCompatibility(req: Request, res: Response): Promise<void> {
    const { slots } = req.body;
    if (!slots) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Component slots payload is required.' } });
      return;
    }

    const result = await pcBuilderService.evaluateCompatibility(slots);
    res.json({ success: true, data: result });
  }
}

export class WalletController {
  async getWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const wallet = await walletService.getOrCreateWallet(req.user.id);
    const transactions = await walletService.getTransactions(req.user.id);

    res.json({
      success: true,
      data: {
        wallet,
        transactions,
      },
    });
  }

  async addFunds(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const { amount, adminPin } = req.body;
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0 || num > 50000) {
      res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number up to 50,000 AED.' } });
      return;
    }

    // Two-tier secondary security check for high-value administrative wallet injections (> 2,500 AED or when PIN is supplied)
    if (adminPin || num > 2500) {
      const pinToVerify = adminPin || (req.headers['x-admin-pin'] as string);
      const userPinHash = req.user.adminPinHash || DEFAULT_SYSTEM_ADMIN_PIN_HASH;
      if (!pinToVerify || !verifyAdminPin(pinToVerify, userPinHash)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_ADMIN_PIN',
            message: 'Secondary Security PIN verification failed. Please enter the valid authorization PIN (default: 888888).',
          },
        });
        return;
      }
    }

    const cleanAmount = Math.round(num * 100) / 100;

    const result = await walletService.creditWallet({
      userId: req.user.id,
      amount: cleanAmount,
      reason: num > 2500 ? 'Authorized High-Value Wallet Injection (PIN Verified)' : 'Direct Customer Wallet Top-up (Demo Sandbox)',
      referenceId: 'topup_card',
    });

    res.json({
      success: true,
      data: {
        ...result.wallet,
        wallet: result.wallet,
        transaction: result.transaction,
        balance: result.wallet.balance,
      },
    });
  }
}

export const pcBuilderController = new PCBuilderController();
export const walletController = new WalletController();

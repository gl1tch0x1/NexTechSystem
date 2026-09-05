import { Request, Response } from 'express';
import { pcBuilderService } from '../services/pc-builder.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { walletService } from '../services/wallet.service.js';

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

    const { amount } = req.body;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number.' } });
      return;
    }

    const result = await walletService.creditWallet({
      userId: req.user.id,
      amount: num,
      reason: 'Direct Customer Wallet Top-up (Demo Sandbox)',
      referenceId: 'topup_card',
    });

    res.json({ success: true, data: result });
  }
}

export const pcBuilderController = new PCBuilderController();
export const walletController = new WalletController();

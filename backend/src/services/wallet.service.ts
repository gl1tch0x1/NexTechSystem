import { v4 as uuidv4 } from 'uuid';
import { walletRepository } from '../repositories/wallet.repository.js';
import { Wallet, WalletTransaction, WalletTransactionType } from '../types/index.js';
import { dbStore } from '../config/db-store.js';

export class WalletService {
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      wallet = await walletRepository.create({
        id: `wallet_${userId}`,
        userId,
        balance: 0,
        currency: 'AED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return wallet;
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance;
  }

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    return walletRepository.getTransactions(userId);
  }

  async creditWallet(params: {
    userId: string;
    amount: number;
    reason: string;
    referenceId?: string;
    type?: WalletTransactionType;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    if (params.amount <= 0) {
      throw new Error('Credit amount must be greater than zero');
    }

    return dbStore.runTransaction(async () => {
      const wallet = await this.getOrCreateWallet(params.userId);
      const balanceBefore = wallet.balance;
      const balanceAfter = Math.round((balanceBefore + params.amount) * 100) / 100;

      const updatedWallet = await walletRepository.update(wallet.id, {
        balance: balanceAfter,
      });

      const tx: WalletTransaction = {
        id: `wtx_${uuidv4()}`,
        userId: params.userId,
        type: params.type || 'CREDIT',
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        reason: params.reason,
        referenceId: params.referenceId,
        createdAt: new Date().toISOString(),
      };

      await walletRepository.addTransaction(tx);
      return { wallet: updatedWallet!, transaction: tx };
    });
  }

  async debitWallet(params: {
    userId: string;
    amount: number;
    reason: string;
    referenceId?: string;
  }): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    if (params.amount <= 0) {
      throw new Error('Debit amount must be greater than zero');
    }

    return dbStore.runTransaction(async () => {
      const wallet = await this.getOrCreateWallet(params.userId);
      if (wallet.balance < params.amount) {
        throw new Error('Insufficient wallet balance');
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Math.round((balanceBefore - params.amount) * 100) / 100;

      const updatedWallet = await walletRepository.update(wallet.id, {
        balance: balanceAfter,
      });

      const tx: WalletTransaction = {
        id: `wtx_${uuidv4()}`,
        userId: params.userId,
        type: 'DEBIT',
        amount: params.amount,
        balanceBefore,
        balanceAfter,
        reason: params.reason,
        referenceId: params.referenceId,
        createdAt: new Date().toISOString(),
      };

      await walletRepository.addTransaction(tx);
      return { wallet: updatedWallet!, transaction: tx };
    });
  }
}

export const walletService = new WalletService();

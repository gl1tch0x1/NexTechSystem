import { BaseRepository } from './base.repository.js';
import { Wallet, WalletTransaction } from '../types/index.js';
import { dbStore } from '../config/db-store.js';

export class WalletRepository extends BaseRepository<Wallet> {
  constructor() {
    super('wallets');
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    return this.findOne([{ field: 'userId', operator: '==', value: userId }]);
  }

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    return dbStore.find<WalletTransaction>('wallet_transactions', {
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async addTransaction(tx: WalletTransaction): Promise<WalletTransaction> {
    return dbStore.create<WalletTransaction>('wallet_transactions', tx);
  }
}

export const walletRepository = new WalletRepository();

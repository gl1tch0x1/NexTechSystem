import { BaseRepository } from './base.repository.js';
import { Reseller } from '../types/index.js';

export class ResellerRepository extends BaseRepository<Reseller> {
  constructor() {
    super('resellers');
  }

  async findByCode(resellerCode: string): Promise<Reseller | null> {
    return this.findOne([{ field: 'resellerCode', operator: '==', value: resellerCode.toLowerCase() }]);
  }

  async findBySubdomain(subdomain: string): Promise<Reseller | null> {
    return this.findOne([{ field: 'subdomain', operator: '==', value: subdomain.toLowerCase() }]);
  }

  async findByUserId(userId: string): Promise<Reseller | null> {
    return this.findOne([{ field: 'userId', operator: '==', value: userId }]);
  }

  async findByUsername(username: string): Promise<Reseller | null> {
    return this.findOne([{ field: 'username', operator: '==', value: username.toLowerCase() }]);
  }
}

export const resellerRepository = new ResellerRepository();

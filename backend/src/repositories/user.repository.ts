import { BaseRepository } from './base.repository.js';
import { User } from '../types/index.js';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return this.findOne([{ field: 'email', operator: '==', value: cleanEmail }]);
  }

  async findByUsername(username: string): Promise<User | null> {
    if (!username) return null;
    const cleanUsername = username.trim().toLowerCase();
    return this.findOne([{ field: 'username', operator: '==', value: cleanUsername }]);
  }
}

export const userRepository = new UserRepository();


import { BaseRepository } from './base.repository.js';
import { User } from '../types/index.js';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne([{ field: 'email', operator: '==', value: email.toLowerCase() }]);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findOne([{ field: 'username', operator: '==', value: username.toLowerCase() }]);
  }
}

export const userRepository = new UserRepository();

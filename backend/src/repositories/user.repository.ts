import { BaseRepository } from './base.repository.js';
import { User } from '../types/index.js';
import { settingsRepository } from './settings.repository.js';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findById(id: string): Promise<User | null> {
    const user = await super.findById(id);
    if (user) return user;

    // Resilient fallback: Check coAdmins registered in settings repository
    try {
      const settings: any = await settingsRepository.getSettings();
      const coAdmins: any[] = settings?.coAdmins || [];
      const matched = coAdmins.find((a: any) => a.id === id);
      if (matched) {
        return {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          username: matched.username,
          role: 'ADMIN',
          phone: matched.phone || '',
          avatar: matched.avatar || '',
          addresses: [],
          passwordHash: matched.passwordHash,
          isActive: matched.isActive !== false,
          createdAt: matched.createdAt || new Date().toISOString(),
          updatedAt: matched.updatedAt,
        };
      }
    } catch {}

    return null;
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.findOne([{ field: 'email', operator: '==', value: cleanEmail }]);
    if (user) return user;

    // Resilient fallback: Check coAdmins registered in settings repository
    try {
      const settings: any = await settingsRepository.getSettings();
      const coAdmins: any[] = settings?.coAdmins || [];
      const matched = coAdmins.find((a: any) => a.email?.toLowerCase() === cleanEmail);
      if (matched) {
        return {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          username: matched.username,
          role: 'ADMIN',
          phone: matched.phone || '',
          avatar: matched.avatar || '',
          addresses: [],
          passwordHash: matched.passwordHash,
          isActive: matched.isActive !== false,
          createdAt: matched.createdAt || new Date().toISOString(),
          updatedAt: matched.updatedAt,
        };
      }
    } catch {}

    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    if (!username) return null;
    const cleanUsername = username.trim().toLowerCase();
    const user = await this.findOne([{ field: 'username', operator: '==', value: cleanUsername }]);
    if (user) return user;

    // Resilient fallback: Check coAdmins registered in settings repository
    try {
      const settings: any = await settingsRepository.getSettings();
      const coAdmins: any[] = settings?.coAdmins || [];
      const matched = coAdmins.find((a: any) => a.username?.toLowerCase() === cleanUsername);
      if (matched) {
        return {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          username: matched.username,
          role: 'ADMIN',
          phone: matched.phone || '',
          avatar: matched.avatar || '',
          addresses: [],
          passwordHash: matched.passwordHash,
          isActive: matched.isActive !== false,
          createdAt: matched.createdAt || new Date().toISOString(),
          updatedAt: matched.updatedAt,
        };
      }
    } catch {}

    return null;
  }
}

export const userRepository = new UserRepository();


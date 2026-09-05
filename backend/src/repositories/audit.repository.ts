import { BaseRepository } from './base.repository.js';
import { AuditLog, StoreSettings, Banner, ProductImportReport } from '../types/index.js';

export class AuditRepository extends BaseRepository<AuditLog> {
  constructor() {
    super('audit_logs');
  }

  async findRecent(limit = 100): Promise<AuditLog[]> {
    return this.find({
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    });
  }
}

export class SettingsRepository extends BaseRepository<StoreSettings & { id: string }> {
  constructor() {
    super('settings');
  }

  async getSettings(): Promise<StoreSettings> {
    const existing = await this.findById('global_settings');
    if (existing) return existing;
    const defaultSettings: StoreSettings & { id: string } = {
      id: 'global_settings',
      storeName: 'NexTech Systems Enterprise E-Commerce',
      supportEmail: 'support@nextechsystems.com',
      supportPhone: '+971 4 800 TECH',
      defaultCurrency: 'AED',
      currencySymbol: 'AED ',
      taxRate: 5,
      standardShippingFee: 25,
      freeShippingThreshold: 500,
      address: 'Silicon Oasis Tech Park, Dubai, UAE',
      taxRegistrationNumber: 'TRN-10029384910003',
      announcementText: '🔥 Enterprise Summer Tech Deals — Up to 40% Off on RTX 4090 Workstations & Servers',
      isAnnouncementActive: true,
      socialLinks: {
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        instagram: 'https://instagram.com',
        linkedin: 'https://linkedin.com'
      }
    };
    await this.create(defaultSettings);
    return defaultSettings;
  }
}

export class BannerRepository extends BaseRepository<Banner> {
  constructor() {
    super('banners');
  }

  async findActive(): Promise<Banner[]> {
    return this.find({
      where: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: { field: 'order', direction: 'asc' }
    });
  }
}

export class ImportRepository extends BaseRepository<ProductImportReport> {
  constructor() {
    super('product_imports');
  }

  async findByResellerId(resellerId: string): Promise<ProductImportReport[]> {
    return this.find({
      where: [{ field: 'resellerId', operator: '==', value: resellerId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }
}

export const auditRepository = new AuditRepository();
export const settingsRepository = new SettingsRepository();
export const bannerRepository = new BannerRepository();
export const importRepository = new ImportRepository();

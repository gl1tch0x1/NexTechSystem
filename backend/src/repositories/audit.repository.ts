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
    if (existing) {
      if (existing.isLandingDiscountBannerActive === undefined) {
        existing.isLandingDiscountBannerActive = true;
      }
      if (!existing.featuredLandingCouponCode) {
        existing.featuredLandingCouponCode = 'TECH10';
      }
      if (!existing.headerNotifications || existing.headerNotifications.length === 0) {
        existing.headerNotifications = [
          {
            id: 'notif_default_1',
            prefix: 'GCC EXPRESS DISPATCH:',
            text: 'Free Insured Shipping on Orders over AED 500 across UAE & GCC',
            link: '/products',
            icon: 'flame',
            isActive: true,
            displayDurationSeconds: 5,
            createdAt: new Date().toISOString(),
          }
        ];
      }
      if (existing.isAnnouncementActive === undefined) {
        existing.isAnnouncementActive = true;
      }
      if (!existing.notificationRotationSeconds) {
        existing.notificationRotationSeconds = 5;
      }
      return existing;
    }
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
      announcementText: 'GCC EXPRESS DISPATCH: Free Insured Shipping on Orders over AED 500 across UAE & GCC',
      isAnnouncementActive: true,
      headerNotifications: [
        {
          id: 'notif_default_1',
          prefix: 'GCC EXPRESS DISPATCH:',
          text: 'Free Insured Shipping on Orders over AED 500 across UAE & GCC',
          link: '/products',
          icon: 'flame',
          isActive: true,
          displayDurationSeconds: 5,
          createdAt: new Date().toISOString(),
        }
      ],
      notificationRotationSeconds: 5,
      isLandingDiscountBannerActive: true,
      featuredLandingCouponCode: 'TECH10',
      socialLinks: {
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        instagram: 'https://instagram.com',
        linkedin: 'https://linkedin.com'
      },
      invoiceStampUrl: '',
      invoiceSignatureUrl: '',
      signatoryName: 'Eng. Tariq Al-Mansouri',
      signatoryTitle: 'Managing Director & Authorized Signatory',
      showStampOnEBill: true,
      showSignatureOnEBill: true,
      invoiceTermsAndConditions: ''
    };
    await this.create(defaultSettings);
    return defaultSettings;
  }

  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const existing = await this.getSettings();
    const merged = {
      ...existing,
      ...updates,
      id: 'global_settings',
      updatedAt: new Date().toISOString()
    };
    if (updates.isLandingDiscountBannerActive !== undefined && Array.isArray(merged.storefrontSections)) {
      merged.storefrontSections = merged.storefrontSections.map((s: any) => {
        if (s.id === 'voucher_banner' || s.id === 'deals_banner') {
          return {
            ...s,
            isVisible: updates.isLandingDiscountBannerActive,
            enabled: updates.isLandingDiscountBannerActive
          };
        }
        return s;
      });
    }
    await this.update('global_settings', merged as any);
    return merged;
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

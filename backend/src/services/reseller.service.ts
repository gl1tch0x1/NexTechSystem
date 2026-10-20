import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { Reseller, User, ResellerStatus, ResellerBusinessInformation } from '../types/index.js';
import { auditService } from './audit.service.js';
import { ENV } from '../config/env.js';

export interface CreateResellerDTO {
  username?: string;
  email?: string;
  password?: string;
  businessName: string;
  displayName: string;
  phone: string;
  resellerCode?: string;
  subdomain?: string;
  address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  businessInformation?: ResellerBusinessInformation;
  commissionRate?: number;
}

export class ResellerService {
  async generateUniqueResellerCode(businessName: string): Promise<string> {
    const base = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 8);
    let code = base || 'reseller';
    let count = 1;

    while (await resellerRepository.findByCode(code)) {
      code = `${base}${count}`;
      count++;
    }

    return code;
  }

  async createReseller(dto: CreateResellerDTO, adminUserId: string): Promise<{
    reseller: Reseller;
    user: User;
    credentials: { username: string; email: string; temporaryPassword: string };
  }> {
    const code = dto.resellerCode
      ? dto.resellerCode.toLowerCase().replace(/[^a-z0-9]/g, '')
      : await this.generateUniqueResellerCode(dto.businessName);

    const existingCode = await resellerRepository.findByCode(code);
    if (existingCode) {
      throw new Error(`Reseller code "${code}" is already taken`);
    }

    const subdomain = dto.subdomain || code;
    const existingSubdomain = await resellerRepository.findBySubdomain(subdomain);
    if (existingSubdomain) {
      throw new Error(`Subdomain "${subdomain}" is already assigned to another reseller`);
    }

    // Auto-generate username if not provided
    let finalUsername = dto.username
      ? dto.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
      : '';
    if (!finalUsername) {
      const baseUser = dto.businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
      finalUsername = `${baseUser || 'reseller'}_admin`;
      let userCount = 1;
      while (await userRepository.findByUsername(finalUsername)) {
        finalUsername = `${baseUser || 'reseller'}_admin${userCount}`;
        userCount++;
      }
    }

    // Auto-generate email if not provided
    const finalEmail = dto.email
      ? dto.email.toLowerCase().trim()
      : `admin@${subdomain}.nextech.ae`;

    const existingUser = await userRepository.findByEmail(finalEmail);
    if (existingUser) {
      throw new Error(`User with email ${finalEmail} already exists`);
    }

    // Auto-generate secure temporary password
    const rawPassword = dto.password && dto.password.trim().length >= 6
      ? dto.password.trim()
      : `NexTech#${crypto.randomBytes(3).toString('hex')}!${crypto.randomInt(10, 100)}`;

    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(rawPassword, salt, 100000, 64, 'sha512').toString('hex');
    const passwordHash = `${salt}:${hash}`;

    const resellerId = `reseller_${uuidv4()}`;
    const userId = `user_${uuidv4()}`;

    const newUser: User = {
      id: userId,
      email: finalEmail,
      role: 'RESELLER',
      name: dto.displayName || dto.businessName,
      username: finalUsername,
      phone: dto.phone,
      addresses: [{ ...dto.address, id: `addr_${uuidv4()}`, isDefaultShipping: true, isDefaultBilling: true }],
      resellerId,
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await userRepository.create(newUser);

    // Create Reseller record
    const newReseller: Reseller = {
      id: resellerId,
      userId,
      resellerCode: code,
      username: finalUsername,
      email: finalEmail,
      businessName: dto.businessName,
      displayName: dto.displayName || dto.businessName,
      phone: dto.phone,
      subdomain,
      address: { ...dto.address, id: `addr_${uuidv4()}` },
      businessInformation: dto.businessInformation || {},
      status: 'ACTIVE',
      productCount: 0,
      salesStats: {
        totalRevenue: 0,
        totalOrders: 0,
        unitsSold: 0,
      },
      commissionRate: dto.commissionRate || 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const createdReseller = await resellerRepository.create(newReseller);

    // Audit log
    const actingAdmin = adminUserId ? await userRepository.findById(adminUserId) : null;
    await auditService.log({
      userId: adminUserId,
      userEmail: actingAdmin?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'RESELLER_CREATED',
      resource: 'resellers',
      resourceId: resellerId,
      details: { resellerCode: code, businessName: dto.businessName, email: finalEmail, username: finalUsername },
    });

    return {
      reseller: createdReseller,
      user: newUser,
      credentials: {
        username: finalUsername,
        email: finalEmail,
        temporaryPassword: rawPassword,
      },
    };
  }

  async getResellerByCode(resellerCode: string): Promise<Reseller | null> {
    return resellerRepository.findByCode(resellerCode);
  }

  async getResellerBySubdomain(subdomain: string): Promise<Reseller | null> {
    return resellerRepository.findBySubdomain(subdomain);
  }

  async getResellerById(id: string): Promise<Reseller | null> {
    return resellerRepository.findById(id);
  }

  async getAllResellers(): Promise<Reseller[]> {
    const resellers = await resellerRepository.find({ orderBy: { field: 'createdAt', direction: 'desc' } });
    // Update live product counts
    for (const r of resellers) {
      const prods = await productRepository.findByResellerId(r.id);
      r.productCount = prods.length;
    }
    return resellers;
  }

  async updateResellerStatus(id: string, status: ResellerStatus, adminUserId: string): Promise<Reseller | null> {
    const updated = await resellerRepository.update(id, { status });
    if (updated) {
      const actingAdmin = adminUserId ? await userRepository.findById(adminUserId) : null;
      await auditService.log({
        userId: adminUserId,
        userEmail: actingAdmin?.email || ENV.ADMIN_DEFAULT_EMAIL,
        userRole: 'ADMIN',
        action: `RESELLER_STATUS_${status}`,
        resource: 'resellers',
        resourceId: id,
        details: { status },
      });
    }
    return updated;
  }

  async updateResellerProfile(id: string, updates: Partial<Reseller>): Promise<Reseller | null> {
    return resellerRepository.update(id, updates);
  }
}

export const resellerService = new ResellerService();

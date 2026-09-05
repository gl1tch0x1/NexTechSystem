import { v4 as uuidv4 } from 'uuid';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { Reseller, User, ResellerStatus } from '../types/index.js';
import { auditService } from './audit.service.js';

export interface CreateResellerDTO {
  username: string;
  email: string;
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
  businessInformation?: {
    taxNumber?: string;
    tradeLicense?: string;
    description?: string;
    website?: string;
  };
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

  async createReseller(dto: CreateResellerDTO, adminUserId: string): Promise<{ reseller: Reseller; user: User }> {
    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error(`User with email ${dto.email} already exists`);
    }

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

    const resellerId = `reseller_${uuidv4()}`;
    const userId = `user_${uuidv4()}`;

    // Create User record with RESELLER role
    const newUser: User = {
      id: userId,
      email: dto.email.toLowerCase(),
      role: 'RESELLER',
      name: dto.displayName,
      username: dto.username.toLowerCase(),
      phone: dto.phone,
      addresses: [{ ...dto.address, id: `addr_${uuidv4()}`, isDefaultShipping: true, isDefaultBilling: true }],
      resellerId,
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
      username: dto.username.toLowerCase(),
      email: dto.email.toLowerCase(),
      businessName: dto.businessName,
      displayName: dto.displayName,
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
    await auditService.log({
      userId: adminUserId,
      userEmail: 'admin@nextech.com',
      userRole: 'ADMIN',
      action: 'RESELLER_CREATED',
      resource: 'resellers',
      resourceId: resellerId,
      details: { resellerCode: code, businessName: dto.businessName, email: dto.email },
    });

    return { reseller: createdReseller, user: newUser };
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
      await auditService.log({
        userId: adminUserId,
        userEmail: 'admin@nextech.com',
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

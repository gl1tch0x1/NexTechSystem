import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { Reseller, User, ResellerStatus, ResellerBusinessInformation } from '../types/index.js';
import { auditService } from './audit.service.js';
import { ENV } from '../config/env.js';
import { z } from 'zod';

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

export interface CreateResellerDTO {
  username: string;
  email: string;
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

export interface ResellerApplicationDTO {
  // Access credentials
  username: string;
  email: string;
  password: string;
  phone: string;
  // Corporate identity
  businessName: string;
  displayName: string;
  // Address
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
  businessInformation: ResellerBusinessInformation;
}

export interface ApproveResellerDTO {
  resellerCode: string;
  subdomain?: string;
  commissionRate?: number;
  adminNotes?: string;
}

const applicationText = (label: string, minimum = 2, maximum = 120) =>
  z.string({ error: `${label} is required.` }).trim()
    .min(minimum, `${label} must be at least ${minimum} characters.`)
    .max(maximum, `${label} is too long.`);

const resellerApplicationSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, 'Username must be 3–30 letters, numbers, or underscores.'),
  email: z.string().trim().email('Enter a valid business email.').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  phone: applicationText('Business phone', 7, 25),
  businessName: applicationText('Legal business name', 3, 160),
  displayName: applicationText('Primary contact name', 2, 120),
  address: z.object({
    fullName: applicationText('Address contact name'),
    phone: applicationText('Address phone', 7, 25),
    addressLine1: applicationText('Registered address', 5, 200),
    addressLine2: z.string().trim().max(200).optional(),
    city: applicationText('City'),
    state: applicationText('State or emirate'),
    country: applicationText('Country'),
    postalCode: z.string().trim().max(30),
  }),
  businessInformation: z.object({
    tradeLicense: applicationText('Trade license number', 3, 80),
    licenseJurisdiction: applicationText('License jurisdiction'),
    licenseExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid license expiry date.').refine(
      value => value >= new Date().toISOString().slice(0, 10),
      'Trade license must not be expired.'
    ),
    taxNumber: applicationText('Tax registration number', 10, 40),
    businessType: applicationText('Business type'),
    specializations: z.array(applicationText('Specialization', 2, 100)).min(1, 'Select at least one specialization.').max(12),
    authorizedSignatory: applicationText('Authorized signatory'),
    signatoryTitle: applicationText('Signatory title'),
    website: z.string().url('Enter a valid website URL.').optional(),
    description: applicationText('Business description', 40, 3000),
    settlementTerms: applicationText('Preferred settlement terms'),
    dispatchHub: applicationText('Primary dispatch hub'),
  }),
});

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

  private async assertEmailAvailable(email: string): Promise<void> {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error(`An account with email ${email} already exists`);
    }
  }

  private async assertUsernameAvailable(username: string): Promise<void> {
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error(`Username "${username}" is already taken`);
    }
    const existingResellerUsername = await resellerRepository.findByUsername(username);
    if (existingResellerUsername) {
      throw new Error(`Username "${username}" is already assigned to a reseller`);
    }
  }

  private async assertCodeAndSubdomainAvailable(code: string, subdomain: string, excludeId?: string): Promise<void> {
    const existingCode = await resellerRepository.findByCode(code);
    if (existingCode && existingCode.id !== excludeId) {
      throw new Error(`Reseller unique ID "${code}" is already taken`);
    }
    const existingSubdomain = await resellerRepository.findBySubdomain(subdomain);
    if (existingSubdomain && existingSubdomain.id !== excludeId) {
      throw new Error(`Subdomain "${subdomain}" is already assigned to another reseller`);
    }
  }

  async createReseller(dto: CreateResellerDTO, adminUserId: string): Promise<{ reseller: Reseller; user: User }> {
    const cleanEmail = dto.email.toLowerCase().trim();
    const cleanUsername = dto.username.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);

    await this.assertEmailAvailable(cleanEmail);
    if (cleanUsername) {
      await this.assertUsernameAvailable(cleanUsername);
    }

    const code = dto.resellerCode
      ? dto.resellerCode.toLowerCase().replace(/[^a-z0-9]/g, '')
      : await this.generateUniqueResellerCode(dto.businessName);

    const subdomain = (dto.subdomain || code).toLowerCase().replace(/[^a-z0-9]/g, '');
    await this.assertCodeAndSubdomainAvailable(code, subdomain);

    const resellerId = `reseller_${uuidv4()}`;
    const userId = `user_${uuidv4()}`;
    const passwordHash = dto.password ? hashPassword(dto.password) : undefined;

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      role: 'RESELLER',
      name: dto.displayName,
      username: cleanUsername,
      phone: dto.phone,
      addresses: [{ ...dto.address, id: `addr_${uuidv4()}`, isDefaultShipping: true, isDefaultBilling: true }],
      resellerId,
      company: dto.businessName,
      tradeLicense: dto.businessInformation?.tradeLicense,
      taxRegistrationNumber: dto.businessInformation?.taxNumber,
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await userRepository.create(newUser);

    const newReseller: Reseller = {
      id: resellerId,
      userId,
      resellerCode: code,
      username: cleanUsername,
      email: cleanEmail,
      businessName: dto.businessName,
      displayName: dto.displayName,
      phone: dto.phone,
      subdomain,
      address: { ...dto.address, id: `addr_${uuidv4()}` },
      businessInformation: dto.businessInformation || {},
      status: 'ACTIVE',
      productCount: 0,
      salesStats: { totalRevenue: 0, totalOrders: 0, unitsSold: 0 },
      commissionRate: dto.commissionRate || 10,
      applicationSource: 'ADMIN_PROVISION',
      approvedAt: new Date().toISOString(),
      approvedBy: adminUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const createdReseller = await resellerRepository.create(newReseller);

    const actingAdmin = adminUserId ? await userRepository.findById(adminUserId) : null;
    await auditService.log({
      userId: adminUserId,
      userEmail: actingAdmin?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'RESELLER_CREATED',
      resource: 'resellers',
      resourceId: resellerId,
      details: { resellerCode: code, businessName: dto.businessName, email: dto.email },
    });

    return { reseller: createdReseller, user: newUser };
  }

  /**
   * Public self-service reseller partner application.
   * Creates a RESELLER user (inactive until approved) + PENDING_APPROVAL reseller record.
   * Temporary placeholder code is replaced by admin-assigned unique ID on approval.
   */
  async applyAsReseller(dto: ResellerApplicationDTO): Promise<{ reseller: Reseller; user: User }> {
    const parsed = resellerApplicationSchema.safeParse(dto);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = String(issue?.path.slice(-1)[0] || 'Application detail')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, character => character.toUpperCase());
      throw new Error(issue?.message === 'Required' ? `${field} is required.` : issue?.message || 'Complete all required reseller details.');
    }
    const application = parsed.data;
    const cleanEmail = application.email.toLowerCase().trim();
    const cleanUsername = application.username;
    const cleanBusinessName = application.businessName;
    const cleanDisplayName = application.displayName;

    await this.assertEmailAvailable(cleanEmail);
    await this.assertUsernameAvailable(cleanUsername);

    const resellerId = `reseller_${uuidv4()}`;
    const userId = `user_${uuidv4()}`;
    const tempCode = `pending${uuidv4().replace(/-/g, '').slice(0, 10)}`;

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      role: 'RESELLER',
      name: cleanDisplayName,
      username: cleanUsername,
      phone: application.phone,
      addresses: [{ ...application.address, id: `addr_${uuidv4()}`, isDefaultShipping: true, isDefaultBilling: true }],
      resellerId,
      company: cleanBusinessName,
      tradeLicense: application.businessInformation.tradeLicense,
      taxRegistrationNumber: application.businessInformation.taxNumber,
      passwordHash: hashPassword(application.password),
      isActive: false, // Locked until admin approval
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await userRepository.create(newUser);

    const newReseller: Reseller = {
      id: resellerId,
      userId,
      resellerCode: tempCode,
      username: cleanUsername,
      email: cleanEmail,
      businessName: cleanBusinessName,
      displayName: cleanDisplayName,
      phone: application.phone,
      subdomain: tempCode,
      address: { ...application.address, id: `addr_${uuidv4()}` },
      businessInformation: {
        ...application.businessInformation,
      },
      status: 'PENDING_APPROVAL',
      productCount: 0,
      salesStats: { totalRevenue: 0, totalOrders: 0, unitsSold: 0 },
      commissionRate: 10,
      applicationSource: 'SELF_APPLICATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const createdReseller = await resellerRepository.create(newReseller);

    await auditService.log({
      userId,
      userEmail: cleanEmail,
      userRole: 'RESELLER',
      action: 'RESELLER_APPLICATION_SUBMITTED',
      resource: 'resellers',
      resourceId: resellerId,
      details: {
        businessName: cleanBusinessName,
        email: cleanEmail,
        tradeLicense: application.businessInformation.tradeLicense,
        taxNumber: application.businessInformation.taxNumber,
        businessType: application.businessInformation.businessType,
        notifyAdmin: true,
        message: `New reseller partner application from ${cleanBusinessName} requires admin review.`,
      },
    });

    return { reseller: createdReseller, user: newUser };
  }

  async getPendingApplications(): Promise<Reseller[]> {
    return resellerRepository.findByStatus('PENDING_APPROVAL');
  }

  async approveApplication(
    id: string,
    dto: ApproveResellerDTO,
    adminUserId: string
  ): Promise<Reseller> {
    const reseller = await resellerRepository.findById(id);
    if (!reseller) {
      throw new Error('Reseller application not found');
    }
    if (reseller.status !== 'PENDING_APPROVAL') {
      throw new Error(`Only pending applications can be approved. Current status: ${reseller.status}`);
    }

    const code = String(dto.resellerCode || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (code.length < 3 || code.length > 30) {
      throw new Error('Admin must assign a unique reseller ID of 3 to 30 alphanumeric characters.');
    }
    if (code.startsWith('pending')) {
      throw new Error('Assign a permanent unique reseller ID — placeholder pending codes are not allowed.');
    }

    const subdomain = (dto.subdomain || code).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (subdomain.length < 3 || subdomain.length > 30) {
      throw new Error('Subdomain must be 3 to 30 alphanumeric characters.');
    }
    if (dto.commissionRate !== undefined && (!Number.isFinite(dto.commissionRate) || dto.commissionRate < 0 || dto.commissionRate > 100)) {
      throw new Error('Commission rate must be between 0 and 100 percent.');
    }
    await this.assertCodeAndSubdomainAvailable(code, subdomain, id);

    const updated = await resellerRepository.update(id, {
      resellerCode: code,
      subdomain,
      status: 'ACTIVE',
      commissionRate: dto.commissionRate ?? reseller.commissionRate ?? 10,
      adminNotes: dto.adminNotes || reseller.adminNotes,
      approvedAt: new Date().toISOString(),
      approvedBy: adminUserId,
      rejectionReason: '',
      deniedAt: undefined,
      deniedBy: undefined,
    });

    if (!updated) {
      throw new Error('Failed to approve reseller application');
    }

    await userRepository.update(reseller.userId, {
      isActive: true,
      updatedAt: new Date().toISOString(),
    });

    const actingAdmin = adminUserId ? await userRepository.findById(adminUserId) : null;
    await auditService.log({
      userId: adminUserId,
      userEmail: actingAdmin?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'RESELLER_APPLICATION_APPROVED',
      resource: 'resellers',
      resourceId: id,
      details: {
        resellerCode: code,
        subdomain,
        businessName: reseller.businessName,
        email: reseller.email,
        notifyApplicant: true,
      },
    });

    return updated;
  }

  async denyApplication(
    id: string,
    reason: string,
    adminUserId: string
  ): Promise<Reseller> {
    const reseller = await resellerRepository.findById(id);
    if (!reseller) {
      throw new Error('Reseller application not found');
    }
    if (reseller.status !== 'PENDING_APPROVAL') {
      throw new Error(`Only pending applications can be denied. Current status: ${reseller.status}`);
    }

    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 10) {
      throw new Error('Provide a denial reason (at least 10 characters) for the applicant record.');
    }

    const updated = await resellerRepository.update(id, {
      status: 'INACTIVE',
      rejectionReason: cleanReason,
      deniedAt: new Date().toISOString(),
      deniedBy: adminUserId,
    });

    if (!updated) {
      throw new Error('Failed to deny reseller application');
    }

    await userRepository.update(reseller.userId, {
      isActive: false,
      updatedAt: new Date().toISOString(),
    });

    const actingAdmin = adminUserId ? await userRepository.findById(adminUserId) : null;
    await auditService.log({
      userId: adminUserId,
      userEmail: actingAdmin?.email || ENV.ADMIN_DEFAULT_EMAIL,
      userRole: 'ADMIN',
      action: 'RESELLER_APPLICATION_DENIED',
      resource: 'resellers',
      resourceId: id,
      details: {
        businessName: reseller.businessName,
        email: reseller.email,
        reason: cleanReason,
        notifyApplicant: true,
      },
    });

    return updated;
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
    for (const r of resellers) {
      const prods = await productRepository.findByResellerId(r.id);
      r.productCount = prods.length;
    }
    return resellers;
  }

  async updateResellerStatus(id: string, status: ResellerStatus, adminUserId: string): Promise<Reseller | null> {
    const current = await resellerRepository.findById(id);
    if (!current) return null;
    if (current.status === 'PENDING_APPROVAL') {
      throw new Error('Review this application using Approve or Deny and assign a unique reseller ID before activation.');
    }
    if (current.rejectionReason && status === 'ACTIVE') {
      throw new Error('A denied application cannot be activated through the status control.');
    }
    if (status !== 'ACTIVE' && status !== 'SUSPENDED' && status !== 'INACTIVE') {
      throw new Error('Invalid reseller status.');
    }
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

      // Sync linked user active flag for suspend/activate
      if (status === 'SUSPENDED' || status === 'INACTIVE') {
        await userRepository.update(updated.userId, { isActive: false, updatedAt: new Date().toISOString() });
      } else if (status === 'ACTIVE') {
        await userRepository.update(updated.userId, { isActive: true, updatedAt: new Date().toISOString() });
      }
    }
    return updated;
  }

  async updateResellerProfile(id: string, updates: Partial<Reseller>): Promise<Reseller | null> {
    const { id: _id, userId: _userId, resellerCode: _code, subdomain: _subdomain,
      status: _status, applicationSource: _source, approvedAt: _approvedAt,
      approvedBy: _approvedBy, deniedAt: _deniedAt, deniedBy: _deniedBy,
      rejectionReason: _rejectionReason, ...safeUpdates } = updates;
    return resellerRepository.update(id, safeUpdates);
  }
}

export const resellerService = new ResellerService();

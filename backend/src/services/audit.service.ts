import { v4 as uuidv4 } from 'uuid';
import { auditRepository } from '../repositories/audit.repository.js';
import { AuditLog, UserRole } from '../types/index.js';

export class AuditService {
  async log(params: {
    userId: string;
    userEmail: string;
    userRole: UserRole;
    resellerId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const logItem: AuditLog = {
      id: `audit_${uuidv4()}`,
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      resellerId: params.resellerId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: new Date().toISOString(),
    };
    return auditRepository.create(logItem);
  }

  async getRecentLogs(limit = 100): Promise<AuditLog[]> {
    return auditRepository.findRecent(limit);
  }
}

export const auditService = new AuditService();

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRole } from '../types/index.js';
import { auditService } from '../services/audit.service.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      auditService.log({
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_ROLE_ACCESS_ATTEMPT',
        resource: req.originalUrl,
        details: { requiredRoles: allowedRoles, currentRole: req.user.role },
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of [${allowedRoles.join(', ')}] role(s).`,
        },
      });
      return;
    }

    next();
  };
}

export function requireResellerTenant(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
    });
    return;
  }

  // Admins can inspect any reseller
  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'RESELLER' || !req.user.resellerId) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access restricted to authorized Resellers only.' },
    });
    return;
  }

  // If resource has a specific resellerId in params or query, enforce strict equality
  const requestedResellerId = req.params.resellerId || req.query.resellerId || req.body.resellerId;
  if (requestedResellerId && requestedResellerId !== req.user.resellerId) {
    auditService.log({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      resellerId: req.user.resellerId,
      action: 'CROSS_TENANT_ACCESS_BREACH_PREVENTED',
      resource: req.originalUrl,
      details: { requestedResellerId, actualResellerId: req.user.resellerId },
    });

    res.status(403).json({
      success: false,
      error: { code: 'TENANT_ISOLATION_VIOLATION', message: 'Unauthorized attempt to access another reseller tenant.' },
    });
    return;
  }

  next();
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    username: string;
    resellerId?: string;
    adminPinHash?: string;
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication token missing or invalid format.' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Try JWT verification (standard backend token)
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    const user = await userRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User account is inactive or not found.' },
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      username: user.username,
      resellerId: user.resellerId,
      adminPinHash: user.adminPinHash,
    };
    next();
  } catch (err: any) {
    // 2. Token invalid / expired
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token is invalid or has expired.' },
    });
  }
}

export function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    userRepository.findById(decoded.id).then(user => {
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          username: user.username,
          resellerId: user.resellerId,
        };
      }
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

export interface RemoteApprovalRequest extends Request {
  approvalOrderId?: string;
  approvalAction?: 'APPROVE' | 'REJECT';
}

function renderAuthErrorHtml(res: Response, statusCode: number, title: string, message: string): void {
  const clientUrl = ENV.CLIENT_URL.replace(/\/$/, '');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | NexTech Systems</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #0b1120; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #131d35; border: 1px solid #1e293b; border-radius: 16px; max-width: 520px; width: 100%; padding: 36px 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 20px; background: #ef4444; color: #ffffff; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; color: #ffffff; }
    p { font-size: 0.95rem; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 10px; transition: background 0.2s; margin-top: 10px; }
    .btn:hover { background: #1d4ed8; }
    .footer { margin-top: 24px; font-size: 0.75rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Unauthorized Action</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div>
      <a class="btn" href="${clientUrl}/admin/orders">Go to Admin Orders Dashboard</a>
    </div>
    <div class="footer">NexTech Systems Enterprise HITL Gateway • Cryptographically Signed Action</div>
  </div>
</body>
</html>`;
  res.status(statusCode).setHeader('Content-Type', 'text/html').send(html);
}

/**
 * Authentication middleware for remote 1-click approvals.
 * Validates cryptographically signed JWT tokens and extracts verified orderId.
 */
export function authenticateRemoteApproval(expectedAction: 'APPROVE' | 'REJECT') {
  return (req: RemoteApprovalRequest, res: Response, next: NextFunction): void => {
    const isJson = Boolean(req.headers.accept?.includes('application/json'));
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

    if (!token) {
      if (isJson) {
        res.status(401).json({ success: false, error: { message: 'Missing remote approval authorization token.' } });
        return;
      }
      return renderAuthErrorHtml(res, 401, 'Missing Approval Token', 'The 1-click authorization signature token was not provided.');
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as {
        orderId: string;
        action: 'APPROVE' | 'REJECT';
        type?: string;
      };

      if (!decoded || decoded.type !== 'REMOTE_ORDER_APPROVAL' || decoded.action !== expectedAction || !decoded.orderId) {
        if (isJson) {
          res.status(403).json({ success: false, error: { message: 'Token authorization action mismatch.' } });
          return;
        }
        return renderAuthErrorHtml(res, 403, 'Invalid Action Token', 'This authorization token is not valid for this action.');
      }

      req.approvalOrderId = String(decoded.orderId);
      req.approvalAction = decoded.action;
      next();
    } catch {
      if (isJson) {
        res.status(403).json({ success: false, error: { message: 'Cryptographic signature verification failed or token expired.' } });
        return;
      }
      return renderAuthErrorHtml(res, 403, 'Signature Failed', 'This 1-click action link is invalid, corrupted, or has expired.');
    }
  };
}

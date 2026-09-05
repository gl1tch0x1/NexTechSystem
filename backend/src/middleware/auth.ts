import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { User, UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    username: string;
    resellerId?: string;
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

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
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

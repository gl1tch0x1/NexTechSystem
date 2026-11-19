import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    console.error('[API Error]', err);
  }

  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = isProd && statusCode >= 500
    ? 'An unexpected error occurred. Please contact technical support.'
    : (err.message || 'An unexpected error occurred processing your request.');

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

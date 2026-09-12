import crypto from 'crypto';

export interface JwtPayload {
  id?: string;
  email?: string;
  role?: string;
  resellerId?: string | null;
  [key: string]: any;
}

export function signJwt(payload: JwtPayload, secret: string, expiresInSeconds: number = 86400 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${encode(header)}.${encode(fullPayload)}`;
  const signature = crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url');

  return `${unsignedToken}.${signature}`;
}

export function verifyJwt<T = JwtPayload>(token: string, secret: string): T {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(unsignedToken).digest('base64url');

  const sigBuf = Buffer.from(signatureB64);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload as T;
}

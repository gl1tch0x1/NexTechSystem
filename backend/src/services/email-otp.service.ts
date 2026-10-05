import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../config/db-store.js';
import { ENV } from '../config/env.js';
import { auditService } from './audit.service.js';

export interface OrderVerificationOtpRecord {
  id: string;
  userId: string;
  email: string;
  otpHash: string;
  expiresAt: string;
  createdAt: string;
  attempts: number;
  consumed: boolean;
  resendAvailableAt: string;
  cartSummary?: {
    total?: number;
    itemsCount?: number;
    currency?: string;
  };
}

export interface RequestOtpResult {
  success: boolean;
  maskedEmail: string;
  expiresAt: string;
  resendCooldownSeconds: number;
  message: string;
  devCode?: string; // Only exposed in non-production environments when explicitly permitted
}

export interface VerifyOtpResult {
  valid: boolean;
  error?: string;
  remainingAttempts?: number;
}

/**
 * Escapes unsafe characters for HTML context to prevent email template injection (XSS/HTMLi)
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class EmailOtpService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly RESEND_COOLDOWN_SECONDS = 60;
  private readonly MAX_ATTEMPTS = 4;
  private readonly MAX_REQUESTS_IN_WINDOW = 5;
  private readonly REQUEST_WINDOW_MINUTES = 15;

  /**
   * Masks email address for user privacy (e.g. "mohammed.khan@company.ae" -> "m***n@company.ae")
   */
  public maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '******';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0] || '*'}***@${domain}`;
    }
    const firstChar = localPart[0];
    const lastChar = localPart[localPart.length - 1];
    return `${firstChar}***${lastChar}@${domain}`;
  }

  /**
   * Hashes an OTP code with customer credentials and application secret
   */
  private hashOtp(userId: string, email: string, code: string): string {
    const salt = `${ENV.JWT_SECRET}_${userId.toLowerCase()}_${email.toLowerCase().trim()}`;
    return crypto.createHmac('sha256', salt).update(code.trim()).digest('hex');
  }

  /**
   * Generates, stores, and dispatches a 6-digit verification code to the customer's email
   */
  async generateAndSendOtp(params: {
    userId: string;
    userEmail: string;
    userName: string;
    cartSummary?: { total?: number; itemsCount?: number; currency?: string };
  }): Promise<RequestOtpResult> {
    const { userId, userEmail, userName, cartSummary } = params;
    // Sanitize email against CRLF injection and whitespace
    const normalizedEmail = userEmail.replace(/[\r\n]/g, '').toLowerCase().trim();
    const now = new Date();

    // 1. Fetch existing OTP records for this user
    const existingRecords = await dbStore.find<OrderVerificationOtpRecord>(
      'order_verification_otps',
      {
        where: [
          { field: 'userId', operator: '==', value: userId },
        ],
      }
    );

    // 2. Prune stale consumed/expired records older than 24 hours to prevent memory/disk bloat
    for (const record of existingRecords) {
      const ageMs = now.getTime() - new Date(record.createdAt).getTime();
      if (record.consumed || ageMs > 24 * 60 * 60 * 1000) {
        await dbStore.delete('order_verification_otps', record.id);
      }
    }

    // 3. Enforce Resend Cooldown (e.g. 60 seconds)
    const activeUnconsumedRecords = existingRecords.filter(r => !r.consumed);
    const latestRecord = activeUnconsumedRecords
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (latestRecord) {
      const resendAvailableAt = new Date(latestRecord.resendAvailableAt).getTime();
      const diffMs = resendAvailableAt - now.getTime();
      if (diffMs > 0) {
        const remainingSeconds = Math.ceil(diffMs / 1000);
        throw new Error(
          `Please wait ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''} before requesting a new verification code.`
        );
      }
    }

    // 4. Enforce Rate Limiting Window (Max requests in last 15 minutes)
    const windowStartTime = new Date(now.getTime() - this.REQUEST_WINDOW_MINUTES * 60 * 1000).getTime();
    const recentRequests = existingRecords.filter(
      r => new Date(r.createdAt).getTime() >= windowStartTime
    );

    if (recentRequests.length >= this.MAX_REQUESTS_IN_WINDOW) {
      throw new Error(
        `Too many verification code requests. For security, please wait ${this.REQUEST_WINDOW_MINUTES} minutes before trying again.`
      );
    }

    // 5. Invalidate previous active unconsumed OTPs for this user
    for (const record of activeUnconsumedRecords) {
      await dbStore.update<OrderVerificationOtpRecord>('order_verification_otps', record.id, {
        consumed: true,
      });
    }

    // 6. Generate cryptographically secure 6-digit number
    const secureCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(userId, normalizedEmail, secureCode);

    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const resendAvailableAt = new Date(now.getTime() + this.RESEND_COOLDOWN_SECONDS * 1000).toISOString();

    const newRecord: OrderVerificationOtpRecord = {
      id: `otp_${uuidv4()}`,
      userId,
      email: normalizedEmail,
      otpHash,
      expiresAt,
      createdAt: now.toISOString(),
      attempts: 0,
      consumed: false,
      resendAvailableAt,
      cartSummary,
    };

    await dbStore.create<OrderVerificationOtpRecord>('order_verification_otps', newRecord);

    // 7. Dispatch Email Notification
    await this.dispatchEmailNotification({
      recipientEmail: normalizedEmail,
      recipientName: userName,
      code: secureCode,
      expiresInMinutes: this.OTP_EXPIRY_MINUTES,
      cartSummary,
    });

    // 8. Security Audit Log
    await auditService.log({
      userId,
      userEmail: normalizedEmail,
      userRole: 'CUSTOMER',
      action: 'ORDER_OTP_GENERATED',
      resource: 'orders',
      details: {
        maskedEmail: this.maskEmail(normalizedEmail),
        expiresAt,
        itemsCount: cartSummary?.itemsCount,
        total: cartSummary?.total,
      },
    });

    const isProduction = ENV.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
    const allowDevOtpExposure = !isProduction && (process.env.EXPOSE_DEV_OTP === 'true' || !ENV.RESEND_API_KEY);

    return {
      success: true,
      maskedEmail: this.maskEmail(normalizedEmail),
      expiresAt,
      resendCooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
      message: `A 6-digit confirmation code was sent to ${this.maskEmail(normalizedEmail)}.`,
      devCode: allowDevOtpExposure ? secureCode : undefined,
    };
  }

  /**
   * Verifies the provided 6-digit code against the user's active OTP record
   */
  async verifyOtp(params: {
    userId: string;
    userEmail: string;
    code: string;
    expectedTotal?: number;
    consumeOnSuccess?: boolean;
  }): Promise<VerifyOtpResult> {
    const { userId, userEmail, code, expectedTotal, consumeOnSuccess = true } = params;
    const normalizedEmail = userEmail.replace(/[\r\n]/g, '').toLowerCase().trim();
    const cleanCode = (code || '').trim();

    if (!cleanCode || !/^\d{6}$/.test(cleanCode)) {
      return {
        valid: false,
        error: 'Verification code must be exactly 6 numeric digits.',
      };
    }

    const records = await dbStore.find<OrderVerificationOtpRecord>(
      'order_verification_otps',
      {
        where: [
          { field: 'userId', operator: '==', value: userId },
        ],
      }
    );

    const activeRecord = records
      .filter(r => !r.consumed)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!activeRecord) {
      return {
        valid: false,
        error: 'No active verification code found. Please request a new code to proceed.',
      };
    }

    // Verify email binding (in case user changed profile email)
    if (activeRecord.email !== normalizedEmail) {
      return {
        valid: false,
        error: 'The account email has changed. Please request a new verification code.',
      };
    }

    // Verify order total integrity (prevents order amount tampering after receiving OTP)
    if (
      expectedTotal != null &&
      activeRecord.cartSummary?.total != null &&
      Math.abs(Number(activeRecord.cartSummary.total) - Number(expectedTotal)) > 0.05
    ) {
      return {
        valid: false,
        error: 'The order total has changed since your verification code was issued. Please request a fresh verification code.',
      };
    }

    const now = new Date();
    if (now.getTime() > new Date(activeRecord.expiresAt).getTime()) {
      await dbStore.update<OrderVerificationOtpRecord>('order_verification_otps', activeRecord.id, {
        consumed: true,
      });
      return {
        valid: false,
        error: 'The verification code has expired. Please request a new code.',
      };
    }

    if (activeRecord.attempts >= this.MAX_ATTEMPTS) {
      await dbStore.update<OrderVerificationOtpRecord>('order_verification_otps', activeRecord.id, {
        consumed: true,
      });
      return {
        valid: false,
        error: 'Maximum verification attempts exceeded. For your security, this code has been revoked. Please request a new code.',
        remainingAttempts: 0,
      };
    }

    const expectedHash = this.hashOtp(userId, normalizedEmail, cleanCode);
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const actualBuf = Buffer.from(activeRecord.otpHash, 'hex');

    // Safe comparison: ensure equal buffer lengths before calling timingSafeEqual to prevent RangeError crash
    const isMatch =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (!isMatch) {
      const updatedAttempts = activeRecord.attempts + 1;
      const remaining = Math.max(0, this.MAX_ATTEMPTS - updatedAttempts);

      await dbStore.update<OrderVerificationOtpRecord>('order_verification_otps', activeRecord.id, {
        attempts: updatedAttempts,
        consumed: updatedAttempts >= this.MAX_ATTEMPTS,
      });

      return {
        valid: false,
        error: remaining > 0
          ? `Invalid verification code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
          : 'Invalid verification code. Maximum attempts reached. Please request a new code.',
        remainingAttempts: remaining,
      };
    }

    // Success: Consume code if requested
    if (consumeOnSuccess) {
      await dbStore.update<OrderVerificationOtpRecord>('order_verification_otps', activeRecord.id, {
        consumed: true,
      });
    }

    return { valid: true };
  }

  /**
   * Reverts a consumed OTP if order placement fails down the pipeline (e.g. stock/pricing error)
   */
  async unconsumeOtp(userId: string): Promise<void> {
    const records = await dbStore.find<OrderVerificationOtpRecord>(
      'order_verification_otps',
      {
        where: [
          { field: 'userId', operator: '==', value: userId },
        ],
      }
    );

    const now = new Date().getTime();
    const latestConsumed = records
      .filter(r => r.consumed && now < new Date(r.expiresAt).getTime())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (latestConsumed) {
      await dbStore.update<OrderVerificationOtpRecord>('order_verification_otps', latestConsumed.id, {
        consumed: false,
      });
    }
  }

  /**
   * Dispatches the branded HTML email via Resend if available, or logs cleanly to console
   */
  private async dispatchEmailNotification(data: {
    recipientEmail: string;
    recipientName: string;
    code: string;
    expiresInMinutes: number;
    cartSummary?: { total?: number; itemsCount?: number; currency?: string };
  }): Promise<void> {
    const { recipientEmail, recipientName, code, expiresInMinutes, cartSummary } = data;
    const sanitizedEmail = recipientEmail.replace(/[\r\n]/g, '').trim();
    const safeName = escapeHtml(recipientName || 'Valued Customer');
    const currency = escapeHtml(cartSummary?.currency || 'AED');
    const totalFormatted = cartSummary?.total != null ? `${currency} ${Number(cartSummary.total).toFixed(2)}` : 'Cart Order';

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: #ffffff; padding: 32px 28px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .code-container { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #0284c7; }
    .validity { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
    .order-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #334155; margin-bottom: 24px; display: flex; justify-content: space-between; }
    .security-note { font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NexTech Systems Enterprise</h1>
      <div class="badge">FTA VAT Compliant &bull; Secure Checkout</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${safeName},</div>
      <p class="text">
        You are confirming a technology hardware order on the NexTech Platform. Please use the one-time verification code below to authorize and confirm your order:
      </p>

      <div class="code-container">
        <div class="code">${escapeHtml(code)}</div>
        <div class="validity">Expires in ${expiresInMinutes} minutes &bull; Single-use only</div>
      </div>

      <div class="order-box">
        <div><strong>Order Total:</strong> ${totalFormatted}</div>
        <div><strong>Destination:</strong> United Arab Emirates</div>
      </div>

      <div class="security-note">
        <strong>Security Notice:</strong> If you did not initiate this transaction, please do NOT share this code with anyone. Your NexTech account remains secure.
      </div>
    </div>
    <div class="footer">
      NexTech System FZ-LLC &bull; Dubai Silicon Oasis, UAE &bull; Official FTA Tax Registered Store
    </div>
  </div>
</body>
</html>
    `;

    // 1. Try Resend API if API Key is configured
    if (ENV.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ENV.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: ENV.EMAIL_FROM || 'NexTech Security <no-reply@nextech.ae>',
            to: sanitizedEmail,
            subject: `[NexTech] ${code} is your Order Verification Code`,
            html: htmlBody,
          }),
        });

        if (response.ok) {
          console.log(`[EmailOtpService] Successfully dispatched OTP email to ${sanitizedEmail} via Resend.`);
          return;
        } else {
          const errData = await response.text();
          console.warn(`[EmailOtpService] Resend dispatch warning:`, errData);
        }
      } catch (err: any) {
        console.warn(`[EmailOtpService] Failed to dispatch via Resend:`, err?.message || err);
      }
    }

    // 2. High-visibility Development & Staging Console Dispatch
    const border = '='.repeat(68);
    console.log(`\n${border}`);
    console.log(`🔐 [NEXTECH SECURITY: ORDER VERIFICATION OTP DISPATCHED]`);
    console.log(`Recipient Email : ${sanitizedEmail}`);
    console.log(`Customer Name   : ${safeName}`);
    console.log(`Order Amount    : ${totalFormatted}`);
    console.log(`OTP Code        : >>>  ${code}  <<<`);
    console.log(`Validity        : ${expiresInMinutes} Minutes`);
    console.log(`${border}\n`);
  }
}

export const emailOtpService = new EmailOtpService();

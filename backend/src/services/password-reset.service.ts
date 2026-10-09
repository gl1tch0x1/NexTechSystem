import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../config/db-store.js';
import { ENV } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { auditService } from './audit.service.js';

export interface PasswordResetOtpRecord {
  id: string;
  userId: string;
  email: string;
  otpHash: string;
  expiresAt: string;
  createdAt: string;
  attempts: number;
  consumed: boolean;
  resendAvailableAt: string;
}

export interface RequestResetOtpResult {
  success: boolean;
  maskedEmail: string;
  expiresAt?: string;
  resendCooldownSeconds: number;
  message: string;
  devCode?: string;
}

export interface VerifyResetOtpResult {
  valid: boolean;
  resetToken?: string;
  error?: string;
  remainingAttempts?: number;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class PasswordResetService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly RESEND_COOLDOWN_SECONDS = 60;
  private readonly MAX_ATTEMPTS = 4;
  private readonly MAX_REQUESTS_IN_WINDOW = 5;
  private readonly REQUEST_WINDOW_MINUTES = 15;

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

  private hashOtp(userId: string, email: string, code: string): string {
    const salt = ENV.JWT_SECRET || 'nextech_reset_salt_2026';
    return crypto
      .createHmac('sha256', salt)
      .update(`${userId.trim()}:${email.toLowerCase().trim()}:${code.trim()}`)
      .digest('hex');
  }

  /**
   * Generates and dispatches a 6-digit password reset OTP to user's registered email
   */
  async requestResetOtp(rawEmail: string): Promise<RequestResetOtpResult> {
    const normalizedEmail = (rawEmail || '').replace(/[\r\n]/g, '').toLowerCase().trim();
    // Guard against ReDoS: Limit input length per RFC 5321 (max 254 chars)
    if (!normalizedEmail || normalizedEmail.length < 5 || normalizedEmail.length > 254) {
      throw new Error('A valid email address is required.');
    }

    // Linear-time O(n) email pattern with disjoint character classes to prevent polynomial backtracking (CWE-1333)
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error('A valid email address is required.');
    }

    const user = await userRepository.findByEmail(normalizedEmail);
    const now = new Date();

    // Prevent user enumeration: If user does not exist or is inactive, simulate delay and return standard response
    if (!user || !user.isActive) {
      // Artificial delay to prevent timing analysis attacks
      await new Promise(r => setTimeout(r, 180 + Math.random() * 80));
      return {
        success: true,
        maskedEmail: this.maskEmail(normalizedEmail),
        resendCooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
        message: `If an active account exists with ${this.maskEmail(normalizedEmail)}, a 6-digit password reset code has been sent.`,
      };
    }

    // 1. Fetch existing reset records for this user
    const existingRecords = await dbStore.find<PasswordResetOtpRecord>(
      'password_reset_otps',
      {
        where: [{ field: 'userId', operator: '==', value: user.id }],
        orderBy: { field: 'createdAt', direction: 'desc' },
      }
    );

    const activeUnconsumedRecords = existingRecords.filter(
      r => !r.consumed && new Date(r.expiresAt).getTime() > now.getTime()
    );

    // 2. Check 60-second Resend Cooldown
    const latestRecord = activeUnconsumedRecords
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (latestRecord) {
      const resendAvailableAt = new Date(latestRecord.resendAvailableAt).getTime();
      const diffMs = resendAvailableAt - now.getTime();
      if (diffMs > 0) {
        const remainingSeconds = Math.ceil(diffMs / 1000);
        throw new Error(
          `Please wait ${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''} before requesting a new password reset code.`
        );
      }
    }

    // 3. Enforce Rate Limiting Window (Max requests in last 15 minutes)
    const windowStartTime = new Date(now.getTime() - this.REQUEST_WINDOW_MINUTES * 60 * 1000).getTime();
    const recentRequests = existingRecords.filter(
      r => new Date(r.createdAt).getTime() >= windowStartTime
    );

    if (recentRequests.length >= this.MAX_REQUESTS_IN_WINDOW) {
      throw new Error(
        `Too many password reset requests. For security, please wait ${this.REQUEST_WINDOW_MINUTES} minutes before trying again.`
      );
    }

    // 4. Invalidate previous active unconsumed OTPs for this user
    for (const record of activeUnconsumedRecords) {
      await dbStore.update<PasswordResetOtpRecord>('password_reset_otps', record.id, {
        consumed: true,
      });
    }

    // 5. Generate cryptographically secure 6-digit OTP
    const secureCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(user.id, normalizedEmail, secureCode);

    const expiresAt = new Date(now.getTime() + this.OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const resendAvailableAt = new Date(now.getTime() + this.RESEND_COOLDOWN_SECONDS * 1000).toISOString();

    const newRecord: PasswordResetOtpRecord = {
      id: `pwd_otp_${uuidv4()}`,
      userId: user.id,
      email: normalizedEmail,
      otpHash,
      expiresAt,
      createdAt: now.toISOString(),
      attempts: 0,
      consumed: false,
      resendAvailableAt,
    };

    await dbStore.create('password_reset_otps', newRecord);

    // 6. Dispatch Email Notification
    await this.dispatchResetEmailNotification({
      recipientEmail: normalizedEmail,
      recipientName: user.name,
      code: secureCode,
      expiresInMinutes: this.OTP_EXPIRY_MINUTES,
    });

    // 7. Security Audit Log
    await auditService.log({
      userId: user.id,
      userEmail: normalizedEmail,
      userRole: user.role,
      action: 'PASSWORD_RESET_OTP_REQUESTED',
      resource: 'auth/forgot-password',
      details: {
        maskedEmail: this.maskEmail(normalizedEmail),
        expiresAt,
      },
    });

    const isProduction = ENV.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
    const allowDevOtpExposure = !isProduction && (process.env.EXPOSE_DEV_OTP === 'true' || !ENV.RESEND_API_KEY);

    return {
      success: true,
      maskedEmail: this.maskEmail(normalizedEmail),
      expiresAt,
      resendCooldownSeconds: this.RESEND_COOLDOWN_SECONDS,
      message: `A 6-digit verification code was sent to ${this.maskEmail(normalizedEmail)}.`,
      devCode: allowDevOtpExposure ? secureCode : undefined,
    };
  }

  /**
   * Verifies the 6-digit OTP code against the user's active password reset record
   * Returns a signed single-use resetToken upon success.
   */
  async verifyResetOtp(rawEmail: string, rawCode: string): Promise<VerifyResetOtpResult> {
    const normalizedEmail = (rawEmail || '').replace(/[\r\n]/g, '').toLowerCase().trim();
    const cleanCode = (rawCode || '').trim();

    if (!normalizedEmail || !/^\d{6}$/.test(cleanCode)) {
      return {
        valid: false,
        error: 'A valid email and 6-digit verification code are required.',
      };
    }

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return {
        valid: false,
        error: 'Invalid or expired verification code.',
      };
    }

    const records = await dbStore.find<PasswordResetOtpRecord>('password_reset_otps', {
      where: [{ field: 'userId', operator: '==', value: user.id }],
      orderBy: { field: 'createdAt', direction: 'desc' },
    });

    const activeRecord = records.find(r => !r.consumed);
    if (!activeRecord) {
      return {
        valid: false,
        error: 'No active password reset code found. Please request a new code.',
      };
    }

    const now = new Date();
    if (now.getTime() > new Date(activeRecord.expiresAt).getTime()) {
      await dbStore.update<PasswordResetOtpRecord>('password_reset_otps', activeRecord.id, {
        consumed: true,
      });
      return {
        valid: false,
        error: 'The verification code has expired. Please request a new code.',
      };
    }

    if (activeRecord.attempts >= this.MAX_ATTEMPTS) {
      await dbStore.update<PasswordResetOtpRecord>('password_reset_otps', activeRecord.id, {
        consumed: true,
      });
      return {
        valid: false,
        error: 'Maximum verification attempts exceeded. For your security, this code has been revoked. Please request a new one.',
        remainingAttempts: 0,
      };
    }

    const expectedHash = this.hashOtp(user.id, normalizedEmail, cleanCode);
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const actualBuf = Buffer.from(activeRecord.otpHash, 'hex');

    const isMatch =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);

    if (!isMatch) {
      const updatedAttempts = activeRecord.attempts + 1;
      const remaining = Math.max(0, this.MAX_ATTEMPTS - updatedAttempts);

      await dbStore.update<PasswordResetOtpRecord>('password_reset_otps', activeRecord.id, {
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

    // Success: Consume OTP immediately to ensure single-use
    await dbStore.update<PasswordResetOtpRecord>('password_reset_otps', activeRecord.id, {
      consumed: true,
    });

    // Generate tamper-proof reset token valid for 10 minutes
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        purpose: 'PASSWORD_RESET',
        otpId: activeRecord.id,
      },
      ENV.JWT_SECRET,
      { expiresIn: '10m', algorithm: 'HS256' }
    );

    await auditService.log({
      userId: user.id,
      userEmail: normalizedEmail,
      userRole: user.role,
      action: 'PASSWORD_RESET_OTP_VERIFIED',
      resource: 'auth/verify-reset-otp',
      details: {
        otpId: activeRecord.id,
      },
    });

    return {
      valid: true,
      resetToken,
    };
  }

  /**
   * Dispatches the branded HTML password reset notification email
   */
  private async dispatchResetEmailNotification(data: {
    recipientEmail: string;
    recipientName: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<void> {
    const { recipientEmail, recipientName, code, expiresInMinutes } = data;
    const sanitizedEmail = recipientEmail.replace(/[\r\n]/g, '').trim();
    const safeName = escapeHtml(recipientName || 'Valued User');

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #0f172a; border-radius: 20px; border: 1px solid rgba(56, 189, 248, 0.2); overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 36px 28px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 5px 14px; background: rgba(255, 255, 255, 0.2); color: #ffffff; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 10px; letter-spacing: 0.5px; }
    .content { padding: 36px 32px; background: #0f172a; }
    .greeting { font-size: 17px; font-weight: 700; color: #f8fafc; margin-bottom: 14px; }
    .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
    .code-container { background: #1e293b; border: 2px dashed #0284c7; border-radius: 16px; padding: 28px; text-align: center; margin: 28px 0; }
    .code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; text-shadow: 0 0 20px rgba(56, 189, 248, 0.4); }
    .validity { font-size: 12px; color: #64748b; margin-top: 12px; font-weight: 600; }
    .security-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px 20px; font-size: 13px; color: #fca5a5; line-height: 1.5; margin-bottom: 24px; }
    .footer { background: #090d16; padding: 24px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NexTech Security Gateway</h1>
      <div class="badge">Password Reset Authorization</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${safeName},</div>
      <p class="text">
        We received a request to reset the password for your NexTech Systems account. Enter the 6-digit one-time verification code below to authorize your password update:
      </p>

      <div class="code-container">
        <div class="code">${escapeHtml(code)}</div>
        <div class="validity">Valid for ${expiresInMinutes} minutes &bull; Single-use only</div>
      </div>

      <div class="security-box">
        <strong>Security Notice:</strong> If you did NOT request this password reset, please ignore this email. Your current password remains secure, and no changes have been made to your account.
      </div>
    </div>
    <div class="footer">
      NexTech System FZ-LLC &bull; Dubai Silicon Oasis, UAE &bull; Enterprise Hardware &amp; IT Infrastructure
    </div>
  </div>
</body>
</html>
    `;

    // 1. Send via Resend API if API Key is configured
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
            subject: `[NexTech Security] ${code} is your Password Reset Code`,
            html: htmlBody,
          }),
        });

        if (response.ok) {
          console.log(`[PasswordResetService] Successfully dispatched password reset OTP email to ${sanitizedEmail} via Resend.`);
          return;
        } else {
          const errData = await response.text();
          console.warn(`[PasswordResetService] Resend dispatch warning:`, errData);
        }
      } catch (err: any) {
        console.warn(`[PasswordResetService] Resend connection failed:`, err.message);
      }
    }

    // 2. High-visibility Development / Sandbox Security Console Log
    console.log('\n====================================================================');
    console.log('🔐 [NEXTECH SECURITY: PASSWORD RESET OTP DISPATCHED]');
    console.log(`Recipient Email : ${sanitizedEmail}`);
    console.log(`Customer Name   : ${recipientName}`);
    console.log(`Purpose         : Account Password Recovery & Authorization`);
    console.log(`OTP Code        : >>>  ${code}  <<<`);
    console.log(`Validity        : ${expiresInMinutes} Minutes`);
    console.log('====================================================================\n');
  }
}

export const passwordResetService = new PasswordResetService();

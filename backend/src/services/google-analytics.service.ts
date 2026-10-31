import crypto from 'crypto';
import { ENV } from '../config/env.js';

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class GoogleAnalyticsService {
  private cachedToken: CachedToken | null = null;

  /**
   * Checks whether Google Analytics service account credentials are provided.
   */
  isConfigured(): boolean {
    return Boolean(ENV.GOOGLE_CLIENT_EMAIL && ENV.GOOGLE_PRIVATE_KEY);
  }

  /**
   * Generates or returns a valid cached Google OAuth2 Bearer Access Token
   * for the Google Analytics Data API (`https://www.googleapis.com/auth/analytics.readonly`).
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    // Reuse token if still valid for more than 5 minutes
    if (this.cachedToken && this.cachedToken.expiresAt > now + 300) {
      return this.cachedToken.token;
    }

    try {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        iss: ENV.GOOGLE_CLIENT_EMAIL,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      })).toString('base64url');

      const signer = crypto.createSign('RSA-SHA256');
      signer.update(`${header}.${payload}`);
      const signature = signer.sign(ENV.GOOGLE_PRIVATE_KEY, 'base64url');
      const assertion = `${header}.${payload}.${signature}`;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('⚠️ [GoogleAnalyticsService] Token exchange failed:', errorText);
        return null;
      }

      const data = await response.json() as { access_token?: string; expires_in?: number };
      if (!data.access_token) {
        return null;
      }

      this.cachedToken = {
        token: data.access_token,
        expiresAt: now + (data.expires_in || 3600),
      };

      return this.cachedToken.token;
    } catch (err: any) {
      console.warn('⚠️ [GoogleAnalyticsService] Error exchanging OAuth2 token:', err?.message || err);
      return null;
    }
  }

  /**
   * Queries Google Analytics 4 Realtime Data API (v1beta).
   * Safely returns live data if authorized, or null with fallback handling.
   */
  async getRealtimeActiveUsers(propertyId?: string): Promise<{ activeUsers: number; minutes: Array<{ minute: string; activeUsers: number }> } | null> {
    const propId = propertyId || ENV.GA_PROPERTY_ID;
    if (!propId) {
      return null;
    }

    const token = await this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propId}:runRealtimeReport`, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: [{ name: 'activeUsers' }],
          dimensions: [{ name: 'minutesAgo' }],
          metricAggregations: ['TOTAL'],
        }),
      });

      if (!res.ok) {
        // If property access is pending or unauthorized, log notice and return null
        return null;
      }

      const report = await res.json() as any;
      const rows = report.rows || [];
      const totalActive = Number(report.totals?.[0]?.metricValues?.[0]?.value ?? 0);
      const minutes: Array<{ minute: string; activeUsers: number }> = [];

      for (const row of rows) {
        const minAgo = row.dimensionValues?.[0]?.value || '0';
        const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
        if (minAgo === 'RESERVED_TOTAL') continue;
        minutes.push({ minute: `${minAgo}m ago`, activeUsers: users });
      }

      return {
        activeUsers: totalActive,
        minutes,
      };
    } catch (err: any) {
      console.warn('⚠️ [GoogleAnalyticsService] Realtime report error:', err?.message || err);
      return null;
    }
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService();


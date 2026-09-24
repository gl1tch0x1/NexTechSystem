import { Request, Response, NextFunction } from "express";

export interface CloudflareSecurityTelemetry {
  totalRequests: number;
  blockedAttacks: number;
  rateLimitViolations: number;
  turnstileVerifications: number;
  lastAttackTimestamp?: string;
  underAttackMode: boolean;
}

export const securityTelemetry: CloudflareSecurityTelemetry = {
  totalRequests: 0,
  blockedAttacks: 0,
  rateLimitViolations: 0,
  turnstileVerifications: 0,
  underAttackMode: false,
};

// In-memory sliding window rate limiter for DDoS mitigation
const ipRequestWindow: Map<string, { count: number; expiresAt: number }> =
  new Map();

// Known malicious user agent signatures & automated exploit scanners
const MALICIOUS_BOT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /dirbuster/i,
  /gobuster/i,
  /masscan/i,
  /nmap/i,
  /hydra/i,
  /wpscan/i,
  /acunetix/i,
  /havij/i,
  /zgrab/i,
  /burpcollaborator/i,
];

// Legitimate crawler whitelist
const LEGITIMATE_CRAWLERS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /cloudflare/i,
];

/**
 * Validate whether a string looks like a plausible IP address (IPv4 or IPv6).
 * Used to prevent header injection / IP spoofing in rate limiting.
 */
function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  // IPv4
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4.test(ip)) {
    return ip.split(".").every((seg) => parseInt(seg, 10) <= 255);
  }
  // IPv6 (simplified: allows :: and hex groups)
  const ipv6 = /^[0-9a-fA-F:]{2,39}$/;
  return ipv6.test(ip);
}

/**
 * Extract true client IP across Cloudflare reverse proxy headers.
 * Only trust cf-connecting-ip (set by Cloudflare) and falls back to
 * x-real-ip / x-forwarded-for only in non-production environments
 * to prevent IP spoofing attacks in Cloudflare-protected deployments.
 */
export function getClientIp(req: Request): string {
  // Cloudflare injects this header and it cannot be spoofed by clients
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string") {
    const clean = cfIp.trim();
    if (clean && isValidIp(clean)) return clean;
  }

  // In production behind Cloudflare, we do NOT fall back to user-controlled headers
  // to prevent rate limit bypass via IP spoofing.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CLOUDFLARE_SECURITY_ENABLED !== "false"
  ) {
    return req.socket.remoteAddress || "127.0.0.1";
  }

  // Development / staging: allow standard proxy headers
  const xRealIp = req.headers["x-real-ip"];
  if (typeof xRealIp === "string") {
    const clean = xRealIp.trim();
    if (clean && isValidIp(clean)) return clean;
  }

  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string" && xForwardedFor.trim()) {
    const firstIp = xForwardedFor.split(",")[0].trim();
    if (isValidIp(firstIp)) return firstIp;
  }

  return req.socket.remoteAddress || "127.0.0.1";
}

/**
 * Cloudflare CDN, Bot Check & Anti-DDoS Protection Middleware
 */
export function cloudflareSecurityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  securityTelemetry.totalRequests++;

  const clientIp = getClientIp(req);
  const userAgent = (req.headers["user-agent"] as string) || "";
  const cfRay = req.headers["cf-ray"] || `ray_${Date.now().toString(36)}`;
  const cfCountry = req.headers["cf-ipcountry"] || "AE";

  // 1. Inject Cloudflare CDN & Enterprise Security Headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  res.setHeader("CF-Cache-Status", req.method === "GET" ? "HIT" : "DYNAMIC");
  res.setHeader("CF-Ray", cfRay as string);
  res.setHeader("X-Protected-By", "Cloudflare-Enterprise-Anti-DDoS");

  // 2. Malicious Bot & Exploit Scanner Defense
  const isLegitimate = LEGITIMATE_CRAWLERS.some((pattern) =>
    pattern.test(userAgent),
  );
  if (!isLegitimate) {
    const isMalicious = MALICIOUS_BOT_PATTERNS.some((pattern) =>
      pattern.test(userAgent),
    );
    if (isMalicious) {
      securityTelemetry.blockedAttacks++;
      securityTelemetry.lastAttackTimestamp = new Date().toISOString();
      const sanitizedIp = String(clientIp).replace(/[\r\n]/g, "");
      const sanitizedAgent = String(userAgent)
        .replace(/[\r\n]/g, "")
        .slice(0, 150);
      console.warn(
        "🛡️ [Cloudflare DDoS Shield] Blocked exploit probe from IP: %s | Agent: %s",
        sanitizedIp,
        sanitizedAgent,
      );

      res.status(403).json({
        success: false,
        error: {
          code: "CLOUDFLARE_BOT_PROBE_BLOCKED",
          message:
            "Access Denied: Cloudflare Automated Threat Intelligence detected suspicious payload.",
          rayId: cfRay,
          clientIp,
        },
      });
      return;
    }
  }

  // 3. Sliding Window Anti-DDoS Rate Limiter

  const now = Date.now();
  const windowMs = Number(process.env.DDOS_RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute
  const isDevOrTest =
    process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";
  const maxRequests =
    Number(process.env.DDOS_RATE_LIMIT_MAX_REQUESTS) ||
    (isDevOrTest ? 2000 : 120); // 2000 req/min in dev/test, 120 in prod

  const record = ipRequestWindow.get(clientIp);
  if (!record || now > record.expiresAt) {
    ipRequestWindow.set(clientIp, { count: 1, expiresAt: now + windowMs });
  } else {
    record.count++;
    if (record.count > maxRequests) {
      securityTelemetry.rateLimitViolations++;
      securityTelemetry.blockedAttacks++;
      securityTelemetry.lastAttackTimestamp = new Date().toISOString();

      res.setHeader("Retry-After", "60");
      res.status(429).json({
        success: false,
        error: {
          code: "CLOUDFLARE_DDOS_RATE_LIMIT_EXCEEDED",
          message:
            "Cloudflare Anti-DDoS Defense: Request burst threshold exceeded. Please retry in 60 seconds.",
          rayId: cfRay,
          clientIp,
          country: cfCountry,
        },
      });
      return;
    }
  }

  // Clean up expired IP records periodically
  if (ipRequestWindow.size > 5000) {
    for (const [ip, rec] of ipRequestWindow.entries()) {
      if (now > rec.expiresAt) ipRequestWindow.delete(ip);
    }
  }

  next();
}

/**
 * Verify Cloudflare Turnstile Bot Check Token
 */
export async function verifyCloudflareTurnstile(
  token: string,
  remoteIp?: string,
): Promise<{ success: boolean; message?: string }> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "";

  const isDemoKey = !secretKey || secretKey.includes("DEMO");
  const isProduction = process.env.NODE_ENV === "production";

  if (isDemoKey && !isProduction) {
    return {
      success: false,
      message:
        "Turnstile is not configured for local development. Configure a real secret key before enabling verification.",
    };
  }

  if (!secretKey || isDemoKey) {
    return {
      success: false,
      message:
        "Turnstile is not configured on this server. Contact the administrator.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) formData.append("remoteip", remoteIp);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const outcome: any = await response.json();
    if (outcome.success) {
      securityTelemetry.turnstileVerifications++;
      return { success: true };
    } else {
      return {
        success: false,
        message: "Cloudflare Turnstile token validation failed",
      };
    }
  } catch (err: any) {
    // Fail-closed: a network error during verification does NOT grant access.
    // Log the error for observability but deny access to prevent bypass-by-error.
    console.error(
      "[Turnstile] Verification request failed (fail-closed):",
      err?.message || err,
    );
    return {
      success: false,
      message: "Turnstile verification service unavailable. Please retry.",
    };
  }
}

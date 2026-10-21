# NexTech Systems — Security Assessment Report

**Target:** `http://localhost:3000/` (Next.js frontend) + `http://localhost:5000/api` (Express backend)
**Codebase:** `E:\eCommerce_Store`
**Date:** 2026-10-21
**Assessment type:** Authorized local white-box code review + black-box dynamic testing
**Scope:** Authentication, authorization/tenant isolation, payments, wallet, orders, file upload, admin console, reseller portal, configuration/secrets, dependencies

---

## 1. Executive Summary

The application has good security foundations (Helmet, CORS allowlist, RBAC middleware, parameterized Mongo filters, PBKDF2 with per-user salts, server-side price calculation, audit logging), but **five issues allow full compromise of the store and/or admin account**, and several others allow financial manipulation.

The most serious problems are:

1. **The "Sign in with Google" endpoint trusts an email address supplied by the client** — no Google ID token is verified. Anyone can authenticate as any existing user, including an administrator, by posting that user's email.
2. **Default/admin bootstrap credentials are present in the environment and work** (`admin@nextech.com` / `password@123`). The bootstrap password is also a permanent alternate login that bypasses the stored password hash.
3. **The JWT signing secret is a known, static value**, and the dev fallback is hard-coded. A forged HS256 token for the admin user was accepted by the admin API.
4. **Orders are marked `PAID` at creation for every payment method except COD / In-Store / BNPL**, and `POST /api/payments/verify` lets the client declare success without any gateway verification. Payment webhooks also fail-open when `NODE_ENV=development`.
5. **`POST /api/upload` is unauthenticated, has no file-type or size validation, and serves uploaded HTML from the store origin** — leading to same-origin stored XSS and theft of the `auth_token` kept in `localStorage`.

A complete account-takeover chain was executed end-to-end against a disposable test account: unverified Google login → read profile → leaked password-reset OTP → reset password → login. Admin access was separately demonstrated with the shipped default credentials and with a forged JWT. All test artifacts were removed afterwards (details in §6).

### Severity totals

| Severity | Count |
|---|---|
| Critical | 6 |
| High | 6 |
| Medium | 5 |
| Low | 4 |

---

## 2. Findings

> CVSS 3.1 base scores are given as guidance. "Conditional" means exploitation depends on how the app is deployed (e.g. `NODE_ENV`, secret exposure, direct backend reachability).

### F-01 — Unverified Google login allows authentication as any user (Critical, CVSS 9.8)

**Location:** `backend/src/controllers/auth.controller.ts:712-767`, `backend/src/routes/auth.routes.ts:20`

**Description:** `POST /api/auth/google` accepts `{ email, name, photoURL }` from the request body. It never verifies a Google ID token, OAuth code, nonce, or audience. It looks the user up by the supplied email (`findByEmail(cleanEmail)`) and issues a full JWT for that account, with that account's real role.

**Proof of concept:**

```
POST /api/auth/google  {"email":"customer.a@nextech-test.ae"}
→ 200 {"success":true,"data":{"token":"…","user":{"id":"user_…","role":"CUSTOMER", …}}}

# Same email as an already-registered account returns the SAME user id:
POST /api/auth/register {...email: victim…}
POST /api/auth/google   {"email": victim…}
→ returned user.id == registered victim user.id (no password/token required)
```

**Impact:** Complete account takeover of any customer or reseller whose email is known. Because `findByEmail` also resolves administrators, the admin account can be taken over the same way. Attacker obtains order history, addresses, invoices, wallet, and admin control.

**Remediation:** Remove the endpoint or verify a Firebase ID token server-side (`admin.auth().verifyIdToken(idToken)`), require the token's `email`/`email_verified` claims, and never accept an email from the body. Bind the account to the Firebase UID, not the email.

---

### F-02 — Default/admin bootstrap credentials and a permanent password backdoor (Critical, CVSS 9.8)

**Location:** `backend/.env`, `frontend/.env.local`; `backend/src/config/env.ts:59-61`; `backend/src/controllers/auth.controller.ts:365-370, 443-449`

**Description:** The environment files ship:

```
ADMIN_BOOTSTRAP_EMAIL=admin@nextech.com
ADMIN_BOOTSTRAP_PASSWORD=password@123
```

Live verification:

```
POST /api/auth/login {"email":"admin@nextech.com","password":"password@123"}
→ 200, role=ADMIN
GET /api/admin/dashboard   → 200
GET /api/admin/customers   → 200
GET /api/admin/audit-logs  → 200
GET /api/admin/backup      → 200 (full DB snapshot: users, orders, wallets, hashes)
```

Two additional design flaws:
- In `login()`, `pwd === ENV.ADMIN_BOOTSTRAP_PASSWORD` is accepted for the bootstrap admin **in addition to** the hash check, so changing the admin password does not disable this backdoor while the env var exists.
- In `register()`, anyone who registers the configured `ADMIN_BOOTSTRAP_EMAIL` is assigned the `ADMIN` role (`isBootstrapAdmin ? 'ADMIN' : 'CUSTOMER'`). On a fresh deployment where the admin record does not yet exist, this is instant privilege escalation.

**Impact:** Full administrative control: CRUD on products/orders/customers/resellers, wallet credits, database backup export (including password hashes and PII), and database restore (destructive).

**Remediation:** Rotate the password immediately; delete the bootstrap-password login branch and the auto-ADMIN-on-register branch; create the first admin through a one-time CLI/bootstrap token that is invalidated after use; require MFA for admin accounts; remove credentials from env files.

---

### F-03 — Known JWT secret enables forged admin sessions (Critical, CVSS 9.8 conditional)

**Location:** `backend/.env` (`JWT_SECRET=nextech_super_secret_jwt_key_2026_enterprise`); `backend/src/config/env.ts:44`

**Description:** A static, human-readable secret is used to sign all access tokens. The code fallback `dev_insecure_local_jwt_secret_change_in_env` is also hard-coded when `NODE_ENV` is not `production`. Anyone who obtains the secret (repo copy, backup, logs, deployment config leak) can mint valid tokens for any user id/role.

**Proof of concept:**

```js
jwt.sign({ id:'user_admin_1', email:'admin@nextech.com', role:'ADMIN' },
         'nextech_super_secret_jwt_key_2026_enterprise', { expiresIn:'1h', algorithm:'HS256' })
```

```
GET /api/admin/dashboard  Authorization: Bearer <forged>
→ 200
```

**Impact:** Authentication bypass and full admin takeover without any credentials. Tokens are valid for 30 days by default.

**Remediation:** Generate a high-entropy (≥256-bit) secret per environment, store it in a secret manager/KMS, rotate it, remove the fallback entirely (fail closed in every environment), and add `jti` + server-side revocation/rotation support. Rotate every secret that shared the same repository/config.

---

### F-04 — Payment bypass: orders auto-marked PAID and client-controlled settlement (Critical, CVSS 8.1)

**Location:** `backend/src/services/order.service.ts:240`; `backend/src/controllers/payment.controller.ts:310-448`; `backend/src/services/tamara.service.ts` / `tabby.service.ts` (webhook verification)

**Description (three related defects):**

1. **Auto-paid at creation:** `paymentStatus: (COD || IN_STORE || BNPL) ? 'PENDING' : 'PAID'`. Any other value — `CREDIT_CARD`, `BANK_TRANSFER`, `WALLET`, or an arbitrary string — is persisted as `PAID` before any money is received. Live proof: a `CREDIT_CARD` order was created with `paymentStatus:"PAID"` and `orderStatus:"PROCESSING"` immediately.
2. **Client declares success:** `POST /api/payments/verify` trusts `{ orderId, status:'success', paymentId }`. For `CREDIT_CARD` it sets `isSettlementVerified = Boolean(paymentId && status==='success')` with no PSP call, even in production. In non-production, the code accepts `status==='success'` whenever provider keys are unset.
3. **Webhooks fail open in development:** `verifyNotificationToken` (Tamara) and `verifyWebhookSignature` (Tabby) return `true` when keys are missing and `NODE_ENV` is `development`/`test`. The shipped `.env` uses `NODE_ENV=development`, so an unauthenticated request can mark any order paid.

**Proof of concept (live):**

```
POST /api/orders  {paymentMethod:"CREDIT_CARD", ...}
→ 201 paymentStatus:"PAID", total 3628.80 AED, no payment performed
POST /api/payments/verify {orderId, status:"success", paymentId:"attacker_fake_txn_001"}
→ 200 paymentStatus:"PAID"
```

**Impact:** Free goods and inventory loss; accounts can place unlimited "paid" orders. In production the `CREDIT_CARD` path remains forgeable because it never calls a real gateway.

**Remediation:** Default every order to `PENDING`; only a server-to-server, signature-verified gateway callback (or an authenticated PSP status API call) may transition to `PAID`; remove client-supplied `status`/`isSimulated`; integrate a real card PSP with 3-D Secure; fail closed on missing webhook secrets in every environment; reconcile captured amounts with the order total.

---

### F-05 — Unauthenticated arbitrary file upload → same-origin stored XSS → token theft (Critical, CVSS 8.8)

**Location:** `frontend/app/api/upload/route.ts:5-29`; token storage in `frontend/lib/auth-context.tsx:83`

**Description:** The upload route accepts multipart files with no authentication, no role check, no MIME/extension allowlist, and no size limit. The filename is sanitised, but any content type is written to `frontend/public/{uploads,brands}`. Files are served from the store origin with a content type derived from the extension.

Live proof:

```
POST http://localhost:3000/api/upload   (no cookies/token)
file = <html><script>alert("stored-xss:"+document.domain)</script>…
→ 200 {"success":true,"url":"/uploads/1792604767764_proof.html"}

GET http://localhost:3000/uploads/1792604767764_proof.html
→ 200  Content-Type: text/html; charset=UTF-8
```

Because `auth-context.tsx` stores the JWT in `localStorage` (`localStorage.getItem('auth_token')`) and login also returns it in the JSON body, script running on the store origin can read the token and exfiltrate it. That upgrades a stored XSS into full account takeover (and admin takeover if an admin opens the link). The same primitive allows hosting phishing pages on the trusted domain and disk exhaustion (no size cap).

**Remediation:** Require authentication + an authorised role, validate magic bytes and an allowlist (`png/jpeg/webp/pdf` only), cap size, randomise names, strip active content, and serve user content from a separate cookieless domain with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`. Block `.html`, `.svg`, `.js`, `.xml` explicitly. Move auth tokens to `HttpOnly` cookies only.

---

### F-06 — Password-reset and order OTPs returned in API responses (Critical/High, CVSS 9.1 conditional)

**Location:** `backend/src/services/password-reset.service.ts:193-203`; `backend/src/services/email-otp.service.ts:194-204`

**Description:** When `NODE_ENV !== 'production'` **and** `RESEND_API_KEY` is unset, the plaintext 6-digit OTP is returned as `devCode` in the API response. The shipped configuration meets both conditions.

Live proof (full takeover chain on a disposable account):

```
POST /api/auth/forgot-password {"email":"victim…"}
→ 200 {"devCode":"619376", …}
POST /api/auth/verify-reset-otp {"email":"victim…","code":"619376"}
→ 200 {"resetToken":"…"}
POST /api/auth/reset-password {"resetToken":"…","newPassword":"OwnedByAttacker123!"}
→ 200
POST /api/auth/login {"email":"victim…","password":"OwnedByAttacker123!"}
→ 200 (account now controlled by attacker)
```

`/api/orders/request-otp` behaves the same way, leaking the checkout OTP. The same probe returned a `devCode` for `admin@nextech.com`, proving the admin account is reachable by this chain (the admin password was **not** changed during testing).

**Impact:** Unauthenticated account takeover of any known email, including administrators, whenever the app runs with the shipped configuration or on any staging/dev deployment reachable from the internet.

**Remediation:** Never return OTPs in HTTP responses. Keep them in email only. If a test bypass is required, gate it behind an explicit `ALLOW_DEV_OTP` flag that is compile-time disabled in production, require a separate test-only secret, and fail closed when `NODE_ENV` is missing. Ensure production sets `NODE_ENV=production` and a working email provider.

---

### F-07 — Production secrets stored in plaintext in the working tree (High, CVSS 8.5 conditional)

**Location:** `backend/.env`, `frontend/.env.local`, root `.env`

**Description:** The tree contains:
- Firebase service-account **private key** (`FIREBASE_PRIVATE_KEY`) for project `nextechsystem0x1` (full cloud admin).
- **MongoDB Atlas credentials** (`MONGODB_URI` with username/password) for the production-looking cluster.
- JWT secret, admin bootstrap credentials, Cloudflare API token/zone ID, GA API secret, payment provider placeholders.

These files are git-ignored (verified — no `.env` in `git ls-files`), which is good, but they are present in plaintext on disk and in any folder copy, ZIP, backup, screen-share, or misconfigured deployment artifact. The service-account key grants full Firebase/Firestore/Storage control; the Mongo URI grants direct database read/write.

**Remediation:** Rotate the Firebase service-account key, Mongo password, JWT secret, admin password, and Cloudflare token. Move secrets to a managed secret store (Doppler/Vault/AWS Secrets Manager) or platform env vars; remove `.env` from developer machines or encrypt with SOPS; add pre-commit secret scanning and CI checks.

---

### F-08 — Reseller profile mass assignment (High, CVSS 7.5)

**Location:** `backend/src/controllers/reseller.controller.ts:65-74`; `backend/src/services/reseller.service.ts:210-212`

**Description:** `PUT /api/reseller/profile` passes `req.body` directly to `resellerRepository.update()`, allowing a reseller to modify fields that should be admin-only.

Live proof (new reseller):

```
PUT /api/reseller/profile {"commissionRate":95,"status":"ACTIVE","businessName":"Mass Assigned Ltd"}
→ 200 … "commissionRate":95, "businessName":"Mass Assigned Ltd"
```

Fields at risk include `commissionRate` (payout manipulation), `status`, `resellerCode`/`subdomain` (tenant identity), `salesStats`, `userId`, and `email`.

**Impact:** Financial fraud via inflated commission, tenant-identity manipulation, and possible cross-tenant confusion. `requireResellerTenant` only checks a `resellerId` field, not the other mutable keys.

**Remediation:** Allowlist self-service fields (`displayName`, `phone`, `address`, `businessInformation` subset). Never accept `status`, `commissionRate`, `resellerCode`, `subdomain`, `userId`, `salesStats`, or IDs from a reseller request. Perform the update server-side with an explicit object.

---

### F-09 — Reseller products can go live without admin approval (High, CVSS 7.1)

**Location:** `backend/src/controllers/reseller.controller.ts:116-131`; `backend/src/services/product.service.ts:50-53, 450-465`

**Description:** Reseller-created products start as `isActive:false`, `approvalStatus:'PENDING_APPROVAL'`. On update, only `approvalStatus` is forced back to `PENDING_APPROVAL`; the body is otherwise merged, including `isActive`, `price`, `isFeatured`, etc. The public catalog filter includes `PENDING_APPROVAL` products as long as `isActive` is true.

Live proof:

```
POST /api/reseller/products {name:"Rogue Product", price:4999, stock:10, …}
→ 201 isActive:false, approvalStatus:PENDING_APPROVAL
PUT /api/reseller/products/<id> {"isActive":true,"price":1}
→ 200 isActive:true, approvalStatus:PENDING_APPROVAL
GET /api/products?search=Rogue%20Product
→ meta.total = 1 (publicly listed at AED 1)
```

**Impact:** Marketplace integrity bypass: unapproved/misrepresented goods are publicly purchasable; a reseller can set arbitrary prices (including AED 1) and self-promote. Combined with F-04, this can be monetised.

**Remediation:** On reseller update, only accept an allowlist (name, description, images, specs, stock, price within policy); force `isActive:false` and `approvalStatus:'PENDING_APPROVAL'` until an admin explicitly approves. Remove `PENDING_APPROVAL` from the public catalog query (only `APPROVED` + `isActive`).

---

### F-10 — Rate-limit bypass via spoofable `cf-connecting-ip`; no account lockout (High, CVSS 6.5)

**Location:** `backend/src/middlewares/cloudflare-security.middleware.ts:76-104`; `backend/src/middlewares/rate-limiter.middleware.ts:8-10`

**Description:** `getClientIp()` trusts `cf-connecting-ip` unconditionally (it is checked before the production branch). If the origin is reachable directly, or Cloudflare is not actually in front, the header is attacker-controlled. Every limiter (API 300/15m, auth 60/15m, order, wallet, admin) is keyed on this value.

Live proof — three requests with different spoofed IPs each received a fresh bucket:

```
cf-connecting-ip: 1.2.3.4 → RateLimit-Remaining: 298
cf-connecting-ip: 5.6.7.8 → RateLimit-Remaining: 298
cf-connecting-ip: 9.9.9.9 → RateLimit-Remaining: 298
```

There is also no per-account login lockout; only the IP limiter protects `/api/auth/login`. With spoofing, unlimited credential stuffing becomes possible.

**Remediation:** Only trust proxy headers from known proxy IP ranges (Cloudflare's published ranges) and configure `trust proxy` accordingly; otherwise use the socket address. Add per-account failed-login throttling/lockout with backoff, CAPTCHA after N failures, and alerting. Never expose the backend port directly to the internet.

---

### F-11 — Overly permissive Firestore rules committed to the repo (Medium, conditional)

**Location:** `firestore.rules:32-63`

**Description:** Rules allow `allow read, write: if true` for `users`, `orders`, `wallets`, `wallet_transactions`, `ebills`, `resellers`, `audit_logs`, and `match /{document=**} { allow read, write: if true; }`. Anyone with the public Firebase config (which is, by design, shipped to browsers) could read and write all customer, order, wallet, and audit data, and mint wallet balances.

A live unauthenticated Firestore REST read returned **403 PERMISSION_DENIED**, so these rules are **not currently deployed**. The risk is that this file is the deployment source of truth and would open the entire database if applied.

**Impact (if deployed):** Total cloud data breach and integrity loss (PII, orders, wallets, resellers, audit logs).

**Remediation:** Replace with least-privilege rules scoped to `request.auth.uid`, deny writes to financial/audit collections from clients, remove the catch-all allow, add tenant checks, and add a CI check that fails if permissive rules are present. Keep Firestore access server-side via the Admin SDK only.

---

### F-12 — Public quote endpoint accepts attacker-controlled prices (Medium, CVSS 5.3)

**Location:** `backend/src/routes/quote.routes.ts:87-114, 269-347`

**Description:** `POST /api/quotes` is public and computes totals from client-supplied `unitPrice`, `discount`, `shipping`, and `discount`. The resulting quote can then be converted by an admin into an order with `paymentStatus:'PAID'` and `orderStatus:'CONFIRMED'` using those same client-controlled numbers.

**Impact:** If an admin clicks "convert", the business records a paid order at an arbitrary (e.g. AED 0.01) price and dispatches goods. Also enables quote spam/notification flooding.

**Remediation:** Price quote lines from the product catalog server-side; treat client prices as "requested" only and require an explicit admin price override with audit trail. Do not mark converted quotes as paid; create them as `PENDING`/`BANK_TRANSFER` awaiting finance confirmation. Add CAPTCHA and stricter rate limiting.

---

### F-13 — Reset token replay and account-enumeration oracles (Medium/Low, CVSS 4.3)

**Location:** `backend/src/controllers/auth.controller.ts:943-1019`; `backend/src/services/password-reset.service.ts:121-142`

**Description:**
- The OTP is marked consumed, but the resulting `resetToken` is a plain 10-minute JWT; `resetPassword()` verifies only signature/purpose and **does not check that the referenced OTP is still consumed/valid**. The same token can reset the password repeatedly for 10 minutes.
- Requesting a reset for an existing account inside the 60-second cooldown returns `Please wait N seconds…`, while a non-existent account returns a generic success — an account-existence oracle.
- Order OTP verification (`/api/orders/verify-otp`) uses `consumeOnSuccess:false`, so a code remains valid until an order is created.

**Impact:** Reduced security margin around recovery flows; enumeration of customer/admin emails; replay window after a reset.

**Remediation:** Store reset tokens server-side with single-use state and bind them to the OTP record (`otpId`); reject reuse; invalidate all tokens/sessions after a successful reset; return identical timing/messages for existing and non-existing accounts (including cooldown).

---

### F-14 — Verbose errors, stack traces, and 500s for blocked CORS origins (Low, CVSS 3.7)

**Location:** `backend/src/middleware/error.ts:15`; `backend/src/app.ts:84-90`

**Description:** Error responses include `details: err.stack` whenever `NODE_ENV === 'development'` (the shipped config). Disallowed CORS origins throw, producing an HTTP **500** with the full stack trace instead of a clean **403**. Invalid JSON also returns a stack trace.

**Impact:** Leaks absolute paths, dependency versions, internal file layout, and code structure; assists targeted exploitation. The 500 also creates noisy monitoring/alerting and may be treated as an availability event.

**Remediation:** Return generic errors in all environments, log details server-side with a correlation id; return 403 for CORS denials; validate/normalise inputs before handlers.

---

### F-15 — Vulnerable dependencies (`xlsx` and Firebase chain) (Medium/High, CVSS 7.5)

**Location:** `backend/package.json` (`xlsx@^0.18.5`, `firebase-admin@^14.5.0`); `npm audit --omit=dev`

**Description:** `npm audit` reports **5 high** and **2 moderate** advisories. `xlsx@0.18.5` is affected by prototype-pollution/ReDoS issues and is used to parse **untrusted reseller uploads** (`reseller/import/preview`). The Firebase dependency chain also reports high advisories.

**Impact:** A reseller can upload a crafted workbook to trigger parser vulnerabilities (potential prototype pollution / DoS). Supply-chain exposure is otherwise limited but should be remediated.

**Remediation:** Replace `xlsx` with a maintained parser (`exceljs`) or upgrade to a patched SheetJS distribution; run `npm audit fix`/upgrade Firebase; add `npm audit`/Dependabot to CI; parse uploads in a sandboxed worker with strict size/cell limits.

---

### F-16 — Warranty "demo" bypass and public serial enumeration (Low, CVSS 3.1)

**Location:** `backend/src/routes/warranty.routes.ts:55-82`

**Description:** If a serial is not found, any value containing `14900`/`4090` or starting with `SN-` returns a fabricated valid warranty. The endpoint is public and returns purchase date, product, and masked order number, allowing enumeration of real serials (rate-limited only by the spoofable IP limiter).

**Impact:** Fraudulent warranty claims; limited PII disclosure.

**Remediation:** Remove the demo branch outside a dedicated demo tenant; require proof of purchase/account match for detailed warranty data; return only generic status for unknown serials; tighten rate limits.

---

### F-17 — Token in `localStorage` + weak CSP (Medium, CVSS 5.4)

**Location:** `frontend/lib/auth-context.tsx:82-92`; `backend/src/app.ts:39-42`; `frontend/next.config.mjs:55-70`

**Description:** The 30-day JWT is persisted in `localStorage` (readable by any script on the origin) while also being set as an `HttpOnly` cookie. The CSP allows `'unsafe-inline'` and `'unsafe-eval'`, so any HTML injection/XSS (see F-05) is trivially executable.

**Impact:** Any XSS becomes durable account takeover; weak CSP removes a key defence-in-depth layer.

**Remediation:** Rely solely on the `HttpOnly`, `Secure`, `SameSite` cookie (drop token from JSON/localStorage); use a nonce/hash-based CSP and remove `unsafe-eval`; set `script-src-attr 'none'`, `base-uri 'none'`, and a strict `frame-ancestors`.

---

### F-18 — `next/image` accepts any remote host (Low/Medium, CVSS 4.3)

**Location:** `frontend/next.config.mjs:10-21`

**Description:** `remotePatterns` allows `https://**` (and `http://localhost`). The Next.js image optimiser will fetch arbitrary URLs server-side, which can be abused for SSRF against internal HTTP services and for bandwidth/DoS.

**Impact:** Internal network probing via `/_next/image?url=http://localhost:…`; resource exhaustion.

**Remediation:** Allowlist the exact image CDNs/hosts in use, require HTTPS, disable the optimiser for user-supplied URLs, and validate content type/size.

---

## 3. Verified Positive Controls

These were reviewed and are working as intended:

- Helmet + HSTS, `X-Frame-Options`, `X-Content-Type-Options`, referrer policy on backend and Next.js.
- CORS allowlist with credentials (disallowed origins blocked, albeit with a 500).
- JWT verification pinned to `HS256`; `passwordChangedAt` invalidates older tokens.
- PBKDF2-SHA512, 100k iterations, unique 32-byte salt per user, timing-safe comparison; legacy hash migration.
- RBAC on admin routes (`authenticate` + `requireRole('ADMIN')`), reseller tenant guard, ownership checks on orders/invoices/payments.
- Server-side order pricing from the catalog (client `unitPrice` ignored), stock/coupon/wallet checks inside a transaction lock, idempotency keys.
- Mongo filter construction uses explicit `$eq`/`$ne` and strips `$`/prototype keys; collection/file names sanitised.
- Input length/format validation and OTP attempt limits; audit logging on sensitive actions.
- Excel import enforces extension + MIME allowlist and 15 MB cap (backend); upload route (frontend) does **not** (F-05).
- `.env` files are git-ignored and were not found in git history.
- Firestore permissive rules in the repo are not deployed (live read returned 403).

---

## 4. OWASP Top 10 (2021) Mapping

| Category | Relevant findings |
|---|---|
| A01 Broken Access Control | F-01, F-02, F-03, F-08, F-09, F-12 |
| A02 Cryptographic Failures | F-03, F-07, F-17 |
| A03 Injection | F-05 (stored XSS), F-15 (parser) |
| A04 Insecure Design | F-04, F-12 |
| A05 Security Misconfiguration | F-06, F-07, F-11, F-14, F-18 |
| A06 Vulnerable Components | F-15 |
| A07 Auth & Identification Failures | F-01, F-02, F-06, F-10, F-13 |
| A08 Data Integrity Failures | F-04, F-08, F-09 |
| A09 Logging/Monitoring Failures | No alerting on admin-token forgery/default-login; audit exists but is not monitored |
| A10 SSRF | F-18 (limited) |

---

## 5. Remediation Roadmap

### Immediate (next 24 hours)
1. Disable `POST /api/auth/google` until token verification is implemented (F-01).
2. Rotate the admin password; remove the `ADMIN_BOOTSTRAP_PASSWORD` login branch and the auto-ADMIN registration branch (F-02).
3. Rotate `JWT_SECRET`, Mongo credentials, Firebase service-account key, Cloudflare token; move to a secret manager (F-03, F-07).
4. Default all orders to `PENDING`; disable `POST /api/payments/verify` client settlement; require signed gateway callbacks; fail closed on webhook verification (F-04).
5. Require auth and enforce type/size allowlists on `/api/upload`; remove `uploads/*.html` and serve user files from a separate domain (F-05).
6. Stop returning `devCode`; set `NODE_ENV=production` and configure Resend (F-06).
7. Patch the reseller profile allowlist and force `isActive:false` + `PENDING_APPROVAL` on updates (F-08, F-09).
8. Restrict rate-limit IP trust to Cloudflare ranges and add per-account login lockout (F-10).

### Short term (1–2 weeks)
9. Fix and deploy Firestore rules; add a CI rule linter (F-11).
10. Server-price quote line items; convert quotes as unpaid (F-12).
11. Single-use, server-stored password-reset tokens; remove enumeration oracles (F-13).
12. Generic error responses and 403 for CORS denials (F-14).
13. Upgrade/replace `xlsx`; upgrade Firebase; enable Dependabot and `npm audit` gates (F-15).
14. Remove the warranty demo branch; require purchase proof (F-16).
15. Move auth to HttpOnly cookies only; adopt a nonce-based CSP (F-17).
16. Allowlist Next image hosts (F-18).

### Long term
17. Add MFA enforcement for all admin/reseller accounts; hardware-key support for super-admins.
18. Add centralised monitoring/alerting for: admin logins from new IPs, token anomalies, multiple failed logins, payment state transitions, mass downloads/backups, reseller price changes.
19. Threat-model the checkout/payment state machine and add invariant tests (no `PAID` without a gateway reference and matching amount).
20. Add SAST/DAST and secret scanning to CI; schedule quarterly pentests; implement a vulnerability disclosure policy.

---

## 6. Testing Notes & Cleanup

- Testing was performed against the local instance only (`localhost:3000`, `localhost:5000`), as authorised by the owner.
- Disposable accounts were created to prove the Google-login takeover (`victim.e8a3b039@example.test`, `customer.a@nextech-test.ae`) and the reseller issues (`reseller.1a0618b7@example.test`).
- Created artifacts were removed after evidence capture:
  - uploaded proof file `frontend/public/uploads/1792604767764_proof.html` — deleted;
  - rogue product `prod_ada83741-…` (AED 1, publicly listed) — deleted via admin API;
  - test order `ORD-2026-448951` — cancelled and stock restored;
  - test customer/reseller accounts — permanently deleted.
- The admin password was **not** changed and the admin account was **not** modified. `admin@nextech.com` was reached only through the already-shipped bootstrap credential and a forged JWT for proof, without altering its state.
- No external systems (MongoDB Atlas, Firebase, PSPs) were written to. A single unauthenticated Firestore **read** was attempted and returned `403 PERMISSION_DENIED`, confirming the permissive rules file is not deployed.

---

## 7. Key Evidence Index

| Finding | Evidence |
|---|---|
| F-01 | `POST /api/auth/google` with an existing email returned that account's user id and a valid 30-day JWT; `/auth/me` returned the victim profile |
| F-02 | `POST /api/auth/login` with `admin@nextech.com` / `password@123` → 200 ADMIN; `/admin/dashboard`, `/admin/customers`, `/admin/audit-logs`, `/admin/backup` → 200 |
| F-03 | HS256 token signed with the env secret → `GET /admin/dashboard` 200 |
| F-04 | `POST /orders` with `CREDIT_CARD` → `paymentStatus:"PAID"` before payment; `POST /payments/verify` trusted `status:"success"` |
| F-05 | Unauthenticated multipart upload → `/uploads/…proof.html` served as `text/html` |
| F-06 | `/auth/forgot-password` returned `devCode`; verify + reset + login chain succeeded |
| F-08 | `PUT /reseller/profile` accepted `commissionRate:95` |
| F-09 | `PUT /reseller/products/:id` with `isActive:true, price:1` → product listed publicly |
| F-10 | Three spoofed `cf-connecting-ip` values each got `RateLimit-Remaining: 298` |
| F-11 | `firestore.rules` allows public read/write; live Firestore read → 403 (not deployed) |
| F-14 | CORS denial returned 500 with a full stack trace |
| F-15 | `npm audit` → 5 high, 2 moderate (`xlsx`, Firebase chain) |

---

*Report generated for the owner of this codebase. All testing was read-only where possible; state-changing proofs were confined to disposable artifacts and cleaned up.*

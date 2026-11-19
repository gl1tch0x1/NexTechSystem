# Changelog

All notable changes to the **NexTech Systems** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-11-19

### Added
- **Strict Reseller Vetting & Admin Authorization**:
  - Reseller registration now requires mandatory upload of official Trade License and VAT Registration Certificate documents (PDF or image).
  - Reseller accounts are initialized with `PENDING_APPROVAL` status; mutating routes (creating/updating products, updating inventory, importing inventory) are strictly locked by the `requireApprovedReseller` middleware until master administrators review and verify credentials.
  - In-app notification banners displayed on the Reseller Dashboard informing partners of real-time onboarding and compliance verification status.
  - Admin approval workflow in the command deck to inspect submitted business credentials, verify UAE Tax Registration Numbers (TRN), and authorize genuine vendor accounts.
- **Login Brute-Force Defense & IP Rate Limiting**:
  - Implemented `login-brute-force.middleware.ts` tracking consecutive failed authentication attempts by client IP address.
  - Intruders and automated credential stuffing attacks exceeding the threshold are blocked with HTTP 429 (`TOO_MANY_ATTEMPTS`) and locked out for a 15-minute cooling period.
- **Client-Side Anti-Inspect & Security Deterrent**:
  - Added `SecurityDeterrent.tsx` to guard application source code integrity and prevent casual unauthorized DevTools inspection.
  - Intercepts and blocks common inspect shortcuts (`F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+U`, `Cmd+Opt+I`, `Cmd+Opt+J`, `Cmd+Opt+U`) and suppresses right-click context menus in production environments.
- **High-Performance Automated WebP Media Pipeline**:
  - Media upload pipeline (`/api/upload`) automatically processes uploaded PNG and JPEG assets via Sharp and converts them to optimized `.webp` format (quality 85, effort 4).
  - Cryptographic content-addressable SHA-256 hashing format: uploads are identified and persisted as `<sha256>.webp` and served through immutable cache headers (`Cache-Control: public, max-age=31536000, immutable`).
  - Added support across frontend URL resolvers for bare SHA-256 hashes, hash filenames, and `hash:<hex>` database references.
- **Media Upload Access Control (RBAC)**:
  - Added `requireMediaUploadAuthorized` middleware restricting asset uploads to Master Administrators (`ADMIN`), Product Editors (`PRODUCT_EDITOR`), and Verified Active Resellers (`RESELLER` with `ACTIVE` status). General customers and unapproved accounts are rejected with HTTP 403.
- **Security Audit Remediations & Compliance Hardening**:
  - **Reseller Inventory Validation**: Reseller inventory patch endpoints reject negative, non-integer, or out-of-range stock numbers and threshold values.
  - **Foreign Vendor Privacy Scoping**: Reseller order listings are strictly filtered to the authenticated reseller's item line items, stripping customer billing addresses, payment metadata, and other vendor lines.
  - **UAE VAT 201 Filing Accuracy**: Updated `VatService` to segregate direct export and free-zone commercial supplies into Box 4 (Zero-Rated Supplies) while properly computing standard 5% output VAT in Box 1a.
  - **Tamara & Tabby Payment Webhook Integrity**: Payment webhooks strictly verify provider origin, order reference existence, currency matching, and exact total amount matching before order settlement.
  - **Cryptographically Bound Order OTP**: Email OTP authorization computes a SHA-256 checkout cart digest and verifies that cart items, currency, and total amount have not been modified between OTP generation and checkout finalization.
- **Comprehensive Test Coverage**:
  - Added `backend/tests/security-reseller-bruteforce.test.ts` verifying reseller document submission, middleware access gating, and IP lockout.
  - Added `backend/tests/upload-webp-conversion.test.ts` verifying automated WebP conversion, SHA-256 content hashing, and PDF document handling.
  - Added `backend/tests/security-audit-remediations.test.ts` verifying inventory validation, vendor order scoping, UAE VAT Box 4 classification, Tamara webhook validation, and cart OTP binding.
  - Expanded test runner to 206 passing tests across all test suites.

### Changed
- **Purged External Pre-Loaded Images**:
  - Completely stripped all third-party `images.unsplash.com` hardcoded fallback URLs across frontend pages, backend mock services, and catalog data stores.
  - Storefront uses neutral SVG placeholders (`DEFAULT_PRODUCT_PLACEHOLDER`) when products have no uploaded assets.
- **Registration Presentation**:
  - Removed promotional badges ("Instant Self-Registration" and "Verified B2B Wholesale") from registration forms to reflect a professional enterprise compliance posture.
- **CodeQL & Static Analysis Remediation**:
  - Resolved `js/file-access-to-http` (CWE-200) in proxy helper.
  - Cleaned up unused variables and imports in test files (`js/unused-local-variable`).
  - Resolved TypeScript strict type errors in test suites.

---

## [1.1.0] - 2026-11-16

### Added
- Enterprise Technical Specifications Matrix with categorized progressive disclosure.
- Multi-warehouse inventory allocation with stock reservations (`reservedStock`).
- Multi-currency live conversion support for GCC currencies (AED, SAR, KWD, USD, EUR, GBP).
- Automated ComNet inventory spreadsheet importer service.
- B2B Corporate Request for Quotation (RFQ) desk with automated PDF quotation generation.

---

## [1.0.0] - 2026-11-10

### Added
- Initial enterprise computer hardware & component commerce platform.
- Next.js 16 App Router frontend with Tailwind CSS and responsive design.
- Express 5 REST API gateway with PBKDF2 authentication, JWT sessions, and RBAC.
- Intelligent PC Builder compatibility matrix with socket, TDP, and clearance validation.
- Cloudflare Turnstile edge bot protection and tiered API rate limiting.

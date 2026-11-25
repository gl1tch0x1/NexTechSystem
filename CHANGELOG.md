# Changelog

All notable changes to the **NexTech Systems** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.1] - 2026-11-25

### Fixed
- **Admin/Editor Product Image Updates**: Fixed the admin and editor product image add/update flow so failed uploads or failed saves are no longer masked as success.
  - Next.js admin product proxy routes now propagate upstream API errors for create/update requests instead of returning synthetic `success: true` local-catalog fallbacks.
  - The Next.js upload proxy no longer converts failed backend uploads into base64 data URLs; it returns actionable upload errors.
  - `ProductEditorPage` and `AdminProductModal` now surface upload failures to the user and no longer inject oversized base64 images into product payloads on upload failure.
  - Admin and reseller product update controllers now return `404` when the target product cannot be updated.

## [1.4.0] - 2026-11-25

### Added
- **Admin Technical Specifications Matrix Combobox**:
  - Replaced preset-only spec inputs in the admin product editor Technical Specifications & Hardware Matrix with a professional Framer Motion combobox (`SpecCombobox`) supporting preset selection, live filtering, and manual value entry.
  - Applied shadcn-style Tailwind UI patterns (rounded surfaces, focus rings, shadow depth, backdrop blur, selected-state indicators) for a polished, enterprise-grade dropdown experience.
- **Custom Definitions Card**:
  - Added a dedicated “Custom Definitions” card/tab after “Display, OS & Regional Compliance” in the Technical Specifications & Hardware Matrix.
  - Admins and editors can add ad-hoc hardware metadata with an “Add Definition” button, animated definition rows, key/value inputs, and removal controls.

### Changed
- **Admin Spec Matrix Layout**: Updated matrix header copy and container rounding to accommodate the new combobox and custom definitions workflow.

### Fixed
- **Spec Combobox Dropdown Clipping**: Removed matrix card overflow clipping and moved rounding to inner header/footer so animated combobox menus render correctly.
- **Admin Spec UI Cleanup**: Replaced misplaced Technical Specs/matrix logos with appropriate icons and removed the AI-style sparkles indicator from Category Key Highlights in favor of a professional list-check icon badge.

---

## [1.3.0] - 2026-11-24

### Added
- **Snappy Framer Motion Navigation & Hover Architecture**:
  - Implemented smooth, spring-physics-driven hover-in and hover-out transitions for the Multi-Currency FX Dropdown (`stiffness: 440, damping: 27, mass: 0.7`) with depth blur filters (`blur(4px)` to `blur(0px)`), trigger button scaling (`whileHover={{ scale: 1.03 }}`), interactive flag pop, and animated active currency dot (`layoutId="active-currency-dot"`).
  - Engineered zero-gap hover bridges (`before:-top-3`) eliminating dead-zone cursor drops between navigation buttons and dropdown panels.
  - Upgraded the Category Sub-Navigation Mega-Menu with high-stiffness spring curves (`stiffness: 420, damping: 26, mass: 0.75`), depth blur transitions, staggered link row hover translations (`whileHover={{ x: 4 }}`), interactive featured card scaling (`whileHover={{ y: -3, scale: 1.01 }}`), and liquid indicator tabs (`layoutId="nav-category-pill"` & `layoutId="nav-category-underline"`).
  - Maintained keyboard accessibility (`Escape` key dismiss, outside click listener) and low-latency response times (110ms–130ms hover-out grace period).
- **Real-Time Global Staff Presence Tracking**:
  - Resolved the "0 Online" counter issue: Persisted live heartbeats directly to MongoDB Atlas `staff_presence` collection, guaranteeing synchronized cross-session presence tracking across serverless lambdas and multi-window instances.
  - Guaranteed minimum online presence for authenticated administrators and synchronized multi-session live presence across different browsers/tabs in real-time.
  - Interactive `OnlineStaffPill` with role badges (Administrators, Product Editors, Resellers) and real-time live search filter.
- **Cross-Account Administrative Synchronization & Product Editors**:
  - Implemented direct MongoDB Atlas CRUD in `/api/admin/editors` and `/api/admin/editors/[...path]` with PBKDF2/SHA-512 password hashing, email/username collision validation, and deletion tombstones (`deleted_editors`).
  - Guaranteed that product editors created by any administrator are immediately synchronized, persisted, and visible across all administrative dashboards.
- **Unified Multi-Tenant Dashboard Telemetry & ERP Metrics**:
  - Rebuilt `/api/admin/dashboard` to compute live aggregate metrics directly from MongoDB Atlas collections (`orders`, `products`, `quotes`, `purchase_orders`, `users`) with disk catalog fallbacks, ensuring all administrator accounts see identical, synchronized real-time platform revenue, order volumes, inventory valuations, and B2B deal velocity.
  - Added dedicated `/api/quotes` and `/api/quotes/[...path]` endpoints to power B2B CRM pipeline tracking and 1-click quote-to-order conversions.
  - Enhanced `/api/admin/purchase-orders` and `/api/admin/resellers` routes with MongoDB Atlas fallback resilience.

### Fixed
- **CodeQL & Static Analysis Security Remediations**:
  - Resolved Alert #320 (CWE-117 log injection) in admin routes by sanitizing user input logging.
  - Resolved Alert #321 & #316 (CWE-570/571 trivial conditionals) in authentication login and catalog service.
  - Resolved Alert #314 (CWE-563 dead store) in media upload routes.
- **Hardware Taxonomy Product Count & Resolution Engine**:
  - Resolved issue where homepage hardware category cards (Processors, GPUs, Motherboards, RAM, Storage, PSUs, Servers, Laptops) displayed "0 verified products" despite inventory containing matching hardware.
  - Implemented semantic category matching (`matchesCategoryFilter` on frontend, `matchesCategory` on backend) to accurately match products by ID, slug, title, specifications, and hardware architecture keywords.
  - Dynamically compute verified product counts in `/api/products/categories` and frontend SSR pages.
  - Seeded missing flagship hardware entries for enterprise servers (Dell PowerEdge R760), motherboards (ASUS ROG Maximus Z790 Dark Hero), and titanium power supplies (Seasonic PRIME TX-1600).
  - Ensured category links (`/products?category=cat_...`) correctly display filtered catalog items.
- **Test Suite Expansion**:
  - Expanded test runner to **207 passing tests** with 100% pass rate.

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

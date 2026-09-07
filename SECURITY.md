# 🛡️ Security Policy & Vulnerability Disclosure

NexTech Systems takes the security of our enterprise commerce platform, customer financial ledgers, and software infrastructure with paramount importance. We appreciate the responsible disclosure of any potential vulnerabilities discovered in this codebase.

---

## 📋 Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported | Status |
| :--- | :---: | :--- |
| `1.0.x` (Current `main`) | ✅ | Active Security Maintenance & Continuous Patching |
| `< 1.0.0` | ❌ | End of Life (Upgrade to latest release) |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or sensitive data exposure, **please DO NOT open a public GitHub issue**.

### Preferred Reporting Channel:
1. **GitHub Private Vulnerability Reporting**:
   - Navigate to the [Security Advisories tab](https://github.com/gl1tch0x1/NexTechSystem/security/advisories/new) of this repository.
   - Click **"Report a vulnerability"** to submit a private, encrypted advisory.

2. **Security Contact**:
   - Alternatively, reach out directly via security disclosure email: **`security@nextech.com`** (or open a private security advisory).

### Please include in your report:
- Description of the vulnerability, severity, and potential business impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Affected API routes, components, or dependencies.
- Any proposed remediation or patch if available.

---

## ⏱️ Vulnerability Response & SLA

Our engineering team adheres to the following response timeline:

- **Initial Acknowledgment**: Within **24 to 48 hours**.
- **Triage & Impact Assessment**: Within **3 business days**.
- **Fix Development & Security Patch**: Within **7 business days** (or sooner for critical severity).
- **Public Disclosure**: Once patched across production releases.

---

## 🔒 Security Architecture & Built-in Defenses

This platform is engineered with defense-in-depth security principles:

1. **Edge Anti-DDoS & Bot Mitigation**:
   - Cloudflare CDN, Layer 7 WAF, burst rate limiters (`120 req/min`), and Cloudflare Turnstile bot challenges.
2. **Stateless JWT Role-Based Access Control (RBAC)**:
   - Cryptographically signed JWT tokens with strict role separation (`ADMIN`, `RESELLER`, `CUSTOMER`).
   - Server-side tenant isolation guarantees that reseller accounts cannot access neighboring vendor data.
3. **Authoritative Server-Side Pricing & Ledgers**:
   - All cart computations, tax invoices, and wallet debits are calculated authoritatively on the backend to prevent client-side price tampering.
4. **Secret Isolation & Zero-Leak Guarantee**:
   - All API keys, private certificates, and environment secrets are strictly excluded via `.gitignore` and managed through `.env` configurations.

---

## 📜 Safe Harbor

We consider security research conducted in good faith and adherence to this policy to be authorized. We will not pursue legal action against researchers who:
- Make a good faith effort to avoid privacy violations, data destruction, and service interruption.
- Give us reasonable time to remediate before public disclosure.
- Do not exploit vulnerabilities beyond the minimum necessary for verification.

Thank you for helping keep **NexTech Systems** safe for everyone!

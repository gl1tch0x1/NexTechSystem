# 💬 Support & Community Assistance

Welcome to **NexTech Systems** support! Here are the best ways to get assistance, report issues, or ask architectural questions.

---

## 🔍 Frequently Asked Questions & Troubleshooting

### 1. Where do I configure Firebase & Cloud credentials?
Copy the `.env.example` templates into `backend/.env` and `frontend/.env.local`. For local offline development, zero-config fallbacks run out-of-the-box using the local disk persistence engine (`data_store/`).

### 2. How do I run the automated integration test suite?
Navigate to the `backend` directory and run:
```bash
cd backend
npx tsx test-suite.ts
```

### 3. How do I access pre-seeded demo accounts?
Use the built-in floating **Role Switcher** badge in the bottom-right corner of the web application, or log in manually with:
- **Admin**: `admin@nextech.com` (`password123`)
- **Reseller**: `reseller@comnet.com` (`password123`, code: `comnet101`)
- **Customer**: `alex.morgan@enterprise.com` (`password123`)

---

## 🛠️ Getting Support

### 🐛 Bug Reports & Feature Requests
If you encountered a software defect, styling issue, or have a feature idea:
- Open a GitHub Issue using our structured [Bug Report Template](https://github.com/gl1tch0x1/NexTechSystem/issues/new?template=bug_report.yml) or [Feature Request Template](https://github.com/gl1tch0x1/NexTechSystem/issues/new?template=feature_request.yml).

### 🛡️ Security Vulnerabilities
For confidential vulnerability reports, please follow our [Security Policy](SECURITY.md) and submit a report privately through GitHub Security Advisories.

### 💡 General Questions & Discussions
For architectural discussions, hardware compatibility engine questions, or integration tips, visit the [GitHub Discussions](https://github.com/gl1tch0x1/NexTechSystem/discussions) tab.

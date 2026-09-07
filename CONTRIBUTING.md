# 🤝 Contributing to NexTech Systems

Thank you for your interest in contributing to **NexTech Systems**! We welcome contributions from developers, hardware enthusiasts, and open-source contributors of all skill levels.

---

## 🛠️ Development Setup & Workflow

### 1. Prerequisites
- **Node.js**: `v18.18.0` or higher (`v20.x` recommended)
- **npm**: `v9.x` or higher
- **Git**: Installed and configured

### 2. Fork & Clone Repository
```bash
git clone https://github.com/gl1tch0x1/NexTechSystem.git
cd NexTechSystem
```

### 3. Install Dependencies
This project is configured as an npm monorepo workspace:
```bash
# Install root, backend, and frontend dependencies in one command
npm install
```

### 4. Configure Local Environment Variables
```bash
# Setup backend environment
cp backend/.env.example backend/.env

# Setup frontend environment
cp frontend/.env.example frontend/.env.local
```

### 5. Launch Local Development Servers
```bash
# Start backend API (Port 5000)
npm run dev:backend

# In a separate terminal, start frontend web app (Port 3000)
npm run dev:frontend
```
- Frontend Storefront: [http://localhost:3000](http://localhost:3000)
- Backend API Server: [http://localhost:5000/api](http://localhost:5000/api)
- API Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🌿 Branching Strategy

Create branch names prefixed with the appropriate scope:
- `feat/feature-name` (New features, builder parts, or UI components)
- `fix/bug-description` (Bug fixes and compatibility corrections)
- `perf/optimization` (Performance enhancements)
- `docs/documentation-update` (Documentation improvements)
- `refactor/component-name` (Code restructuring without feature changes)

```bash
git checkout -b feat/add-amd-am5-motherboards
```

---

## 🧪 Testing & Code Quality Standards

Before submitting a Pull Request, verify that all linters, typecheckers, and automated test suites pass cleanly:

```bash
# 1. Typecheck Backend
cd backend
npm run lint

# 2. Run Automated 38-Step Integration Test Suite
npx tsx test-suite.ts

# 3. Typecheck & Build Frontend
cd ../frontend
npm run build
```

---

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(pc-builder): add DDR5 memory frequency validation`
- `fix(auth): prevent token expiration desynchronization`
- `docs(readme): update system architecture diagrams`
- `perf(catalog): optimize faceted search filtering algorithm`
- `refactor(pricing): isolate VAT calculation utility`

---

## 🚀 Pull Request (PR) Checklist

1. Ensure no `.env`, secret keys, or test credentials are committed.
2. Ensure `npm run lint` and `npm run build` pass with zero errors.
3. Write clear descriptions of what the PR accomplishes and link relevant issues.
4. Keep PRs focused and modular for streamlined code reviews.

---

## 📜 Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure an inclusive, respectful, and harassment-free environment for everyone.

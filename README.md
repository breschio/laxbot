# Laxbot 1.0

The default source for lacrosse scores, rankings, and stats — built with a core focus on automation, reliability, and scale.

## 🏗️ Project Structure

```
laxbot/
├── apps/
│   └── web/               # Frontend (Vite + React + TypeScript)
│
├── packages/
│   ├── api/              # Backend API & Scrapers
│   └── db/               # Database Schema & Migrations
│
├── package.json          # Root package.json
├── pnpm-workspace.yaml   # pnpm workspace config
└── turbo.json           # Turborepo config
```

## 🚀 Getting Started

1. **Prerequisites**
   ```bash
   npm install -g pnpm    # Install pnpm if you haven't already
   ```

2. **Install Dependencies**
   ```bash
   pnpm install          # Install all workspace dependencies
   ```

3. **Development**
   ```bash
   pnpm dev             # Start all apps in dev mode
   ```

## 📦 Workspace Structure

- **/apps/web**: Frontend application built with Vite, React, TypeScript, and TailwindCSS
- **/packages/api**: Backend API server, route handlers, and web scrapers
- **/packages/db**: Database schema, migrations, and query utilities

## 🛠️ Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Lint all packages and apps

## 📝 Development Notes

- Uses pnpm workspaces for monorepo management
- Turborepo for build system optimization
- Shared packages can be imported across the workspace # laxbot

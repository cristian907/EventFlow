# EventFlow

Event management system built with TypeScript, NodeJS, ReactJS.

## Project Structure

```
EventFlow/
├── packages/
│   ├── shared/          # @eventflow/shared - Shared utilities, types and schemas
│   ├── api/             # Backend - Express.js API server
│   └── web/             # Frontend - React with Vite
├── package.json         # Root workspace configuration
└── tsconfig.json        # Base TypeScript configuration
```

## Workspaces

### `@eventflow/shared`
Shared package containing TypeScript types, interfaces, and utility functions used by both frontend and backend.

**Location:** `packages/shared/`

### `api`
Backend API built with Express.js and TypeScript.

**Location:** `packages/api/`

**Stack:**
- Node.js
- Express.js
- TypeScript
- CORS enabled
- Hot reload with nodemon + tsx

### `web`
Frontend application built with React, TypeScript, and Vite.

**Location:** `packages/web/`

**Stack:**
- React 18
- TypeScript
- Vite
- Fast refresh in development

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository
```bash
git clone git@github.com:cristian907/EventFlow.git
cd EventFlow
```

2. Install dependencies
```bash
npm install
```
This installs all dependencies for all workspaces and creates symlinks.

3. Set up environment variables
```bash
# API
cp packages/api/.env.example packages/api/.env

# Web
cp packages/web/.env.example packages/web/.env
```
Edit the `.env` files if you need different ports or URLs.

4. Build shared package
```bash
npm run build:shared
```

## Development

### Run all servers (recommended)
```bash
npm run dev
```
Starts both API and web servers in parallel:
- API: http://localhost:3000
- Web: http://localhost:5173

### Run servers individually

**API only:**
```bash
npm run dev:api
```

**Web only:**
```bash
npm run dev:web
```

**Shared package (watch mode):**
```bash
cd packages/shared
npm run dev
```

## Development Workflow

1. **Make changes to shared package:**
   - Edit `packages/shared/src/index.ts`
   - API and web will auto-reload (nodemon watches shared)

2. **Make changes to API:**
   - Edit files in `packages/api/src/`
   - Server auto-restarts via nodemon

3. **Make changes to web:**
   - Edit files in `packages/web/src/`
   - Browser auto-refreshes via Vite HMR

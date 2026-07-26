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
- pnpm >= 9.0.0

### Installation

1. Clone the repository
```bash
git clone git@github.com:cristian907/EventFlow.git
cd EventFlow
```

2. Install dependencies
```bash
pnpm install
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
pnpm run build:shared
```

## Development

### Run all servers (recommended)
```bash
pnpm run dev
```
Starts both API and web servers in parallel:
- API: http://localhost:3000
- Web: http://localhost:5173

### Run servers individually

**API only:**
```bash
pnpm run dev:api
```

**Web only:**
```bash
pnpm run dev:web
```

**Shared package (watch mode):**
```bash
cd packages/shared
pnpm run dev
```

## Development Workflow

1. **Make changes to shared package:**
   - Edit `packages/shared/src/index.ts`
   - Run `pnpm run build:shared` to rebuild the package
   - API and web will auto-reload (nodemon watches shared)

2. **Make changes to API:**
   - Edit files in `packages/api/src/`
   - Server auto-restarts via nodemon

3. **Make changes to web:**
   - Edit files in `packages/web/src/`
   - Browser auto-refreshes via Vite HMR

## Database

### Initial setup
After installing dependencies and configuring `.env`, run:
```bash
# Generate the Prisma client
pnpm --filter api exec prisma generate

# Apply all migrations
pnpm --filter api exec prisma migrate dev

# Seed the database with test users and events
pnpm --filter api run seed
```

### Reset the database from scratch
Drops all tables, re-applies every migration and runs the seed:
```bash
pnpm --filter api exec prisma migrate reset
```

### After modifying the Prisma schema (`schema.prisma`)
```bash
# Create a new migration from your schema changes
pnpm --filter api exec prisma migrate dev --name describe_your_change

# If the generated Prisma client is out of date
pnpm --filter api exec prisma generate
```

### Switching branches with different schemas
When you switch to a branch that has different database tables or columns, the generated Prisma client and the database may be out of sync. Run:
```bash
# 1. Regenerate the Prisma client for the current branch's schema
pnpm --filter api exec prisma generate

# 2. Reset the database to match the current branch's migrations
pnpm --filter api exec prisma migrate reset

# 3. Rebuild shared package (if the branch has schema/type changes)
pnpm run build:shared
```

## Running from scratch (full checklist)

```bash
# 1. Clone and install
git clone git@github.com:cristian907/EventFlow.git
cd EventFlow
pnpm install

# 2. Environment variables
cp packages/api/.env.example packages/api/.env
cp packages/web/.env.example packages/web/.env

# 3. Build shared package
pnpm run build:shared

# 4. Setup database
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate dev
pnpm --filter api run seed

# 5. Start development servers
pnpm run dev
```


# Tenant-based Custom Theme POC

POC SaaS app demonstrating tenant-based theming.

## What this includes

- **Node.js + Express backend** with MariaDB.
- **React + MUI frontend** with runtime theme application.
- Database entities:
  - `theme`: primary/secondary/base colors + three font types.
  - `tenant`: links each tenant to one `theme`.
  - `component`: tracks frontend component keys and whether each is theme-customizable.
- Seed data for **3 tenants** and **10 UI component entries**.

## Project structure

- `backend/` API and DB bootstrap/seed logic
- `frontend/` React app with 10 simplistic layout components

## Quick start

### 1) Start local MariaDB

Example using Docker:

```bash
docker run --name tenant-theme-mariadb \
  -e MARIADB_ROOT_PASSWORD=password \
  -e MARIADB_DATABASE=tenant_theme_poc \
  -p 3306:3306 -d mariadb:11
```

### 2) Install dependencies

```bash
npm install
```

### 3) Configure backend env

```bash
cp backend/.env.example backend/.env
```

Adjust values if needed.

### 4) Start backend

```bash
npm run dev:backend
```

The backend auto-creates tables and seed rows on first run.

### 5) Start frontend

In a new terminal:

```bash
npm run dev:frontend
```

Frontend runs at `http://localhost:5173` and calls backend at `http://localhost:4000/api`.

## API endpoints

- `GET /api/health`
- `GET /api/tenants`
- `GET /api/theme-config/:tenantId`

## Flow implemented

1. App loads tenants from backend.
2. App fetches theme config for selected tenant.
3. MUI theme is built dynamically from backend colors/fonts.
4. Around 10 components render and reflect runtime theme.

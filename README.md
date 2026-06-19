# FiberOps

**FiberOps** is a production-grade telecom network operations dashboard designed to map every fiber route, pole, junction box, splitter, ONU, POP, and customer connection in one live system.

## Overview

FiberOps provides an enterprise-grade GIS dashboard for:

- Visualizing fiber network infrastructure
- Monitoring network health and KPIs
- Managing physical assets and customer connections
- Tracking and resolving incidents
- Coordinating field work with work orders
- Planning network expansion with map-based proposals
- Generating operational reports

The app uses a **frontend-first architecture**: domain types, Zod schemas, repository interfaces, and a mock API layer define the contract. In development, MSW intercepts browser requests; in all environments, Next.js route handlers at `/api` serve the same mock backend via `src/mocks/apiRouter.ts`, so the UI behaves consistently without a separate server.

**Backend implementers:** see [docs/backend/README.md](./docs/backend/README.md) for the full API contract, domain models, WebSocket protocol, database schema, and frontend integration guide.

## Technology Stack

| Layer | Tools |
|-------|-------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| UI | `@shohojdhara/atomix`, Sass |
| State | Zustand |
| Data fetching | TanStack Query |
| Maps | Mapbox GL JS |
| Forms & validation | React Hook Form + Zod |
| Mock API | MSW (dev) + Next.js `/api` routes |
| Animation | GSAP |
| Icons | Phosphor Icons (`@phosphor-icons/react`) |
| Testing | Vitest, Testing Library |
| Code quality | ESLint + Prettier |

## Application Modules

| Route | Module | Highlights |
|-------|--------|------------|
| `/` | **Home** | Operations center with key metrics, quick links, and activity feed |
| `/dashboard` | **Dashboard** | KPI cards, outage feed, technician widget, fiber usage/revenue charts, mini network map |
| `/network-map` | **Network Map** | Full-viewport GIS canvas with layer controls, asset search, route tracing, heat maps, measurement tools, and planning draw mode |
| `/assets` | **Assets** | Inventory list, asset registration, detail panels, maintenance timelines, and connection graphs |
| `/customers` | **Customers** | Searchable profiles, signal health, connection path tracing, and incident history |
| `/incidents` | **Incidents** | Severity filters, map previews, status timelines, and report/resolve flows |
| `/work-orders` | **Work Orders** | Kanban board and table views with full CRUD, deep links, and incident/asset cross-references |
| `/planning` | **Planning** | Expansion proposals with budget tracking, timelines, and map deep links for drawing proposed routes |
| `/reports` | **Reports** | Summary dashboards, incident analytics, uptime metrics, report generation, and export history |
| `/settings` | **Settings** | Organization, team, integrations, and billing (sub-routes under `/settings/*`) |
| `/help` | **Help** | In-app help content |

## Getting Started

### Prerequisites

- Node.js LTS
- Yarn
- [Mapbox access token](https://account.mapbox.com/access-tokens/)

### Installation

1. **Install dependencies:**

   ```bash
   yarn install
   ```

2. **Environment setup:**

   Copy the example file and add your Mapbox token:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   ```

   Optional variables:

   | Variable | Purpose |
   |----------|---------|
   | `NEXT_PUBLIC_WS_URL` | WebSocket URL for live network map updates (defaults to mock WS in dev) |
   | `NEXT_PUBLIC_ERROR_ENDPOINT` | Remote error reporting endpoint in production |

3. **Start the development server:**

   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000). MSW starts automatically in development before the app mounts.

### Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start Next.js dev server |
| `yarn build` | Production build |
| `yarn start` | Serve production build |
| `yarn lint` | Run ESLint |
| `yarn test` | Run Vitest unit tests |

## Architecture

```
src/
├── app/              # Next.js App Router pages, layouts, global styles, and /api routes
├── components/       # Reusable UI primitives (no business logic)
├── patterns/         # Composite layout sections (e.g. Shell sidebar)
├── modules/          # Feature-owned code (network-map, work-orders, planning, etc.)
├── services/         # Repository interfaces and API adapter layer
├── mocks/            # Mock datasets, apiRouter, and MSW browser worker
├── types/            # Shared TypeScript domain models
└── lib/              # Cross-cutting utilities and mappers
```

**Data flow:** UI hooks in `src/modules/*/hooks/` call repository adapters in `src/services/`, which `fetch()` `/api/*`. The catch-all handler at `src/app/api/[...path]/route.ts` delegates to `src/mocks/apiRouter.ts`. Report-specific routes under `src/app/api/reports/` follow the same mock data layer.

**Source of truth for backend contracts:**

- Types: `src/types/domain.ts`
- Repositories: `src/services/repositories.ts`
- API behavior: `src/mocks/apiRouter.ts`
- Validation: `src/modules/**/schemas/*.schema.ts`

## Design Direction

The UI reflects a **premium telecom software** feel:

- Clean, modern, and operational
- Low visual noise with a crisp, technical tone
- Subtle, meaningful, and performant motion (GSAP)
- Strict adherence to the `@shohojdhara/atomix` design system

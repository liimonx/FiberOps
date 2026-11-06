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

The app runs entirely on **local mock data**. Domain types, Zod schemas, repository interfaces, and `src/mocks/` define the contract. Every `/api` request is handled by the same-origin Next.js route handlers and `src/mocks/apiRouter.ts` in development and production; no external API server or service worker is required. Configured integrations are simulated locally and do not send outbound requests. The network map uses a local animated mock basemap and topology when no Mapbox token is configured; the optional Mapbox basemap requires internet access and a token.

## Technology Stack

| Layer | Tools |
|-------|-------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| UI | `@shohojdhara/atomix`, Sass |
| State | Zustand |
| Data fetching | TanStack Query |
| Maps | Local SVG/CSS mock renderer; optional Mapbox GL JS basemap |
| Forms & validation | React Hook Form + Zod |
| Mock API | Local Next.js `/api` route handlers (all environments) |
| Animation | GSAP |
| Icons | Phosphor Icons (`@phosphor-icons/react`) |
| Testing | Vitest, Testing Library |
| Code quality | ESLint + Prettier |

## Application Modules

| Route | Module | Highlights |
|-------|--------|------------|
| `/` | **Home** | Operations center with key metrics, quick links, and activity feed |
| `/dashboard` | **Dashboard** | KPI cards, outage feed, technician widget, fiber usage/revenue charts, mini network map |
| `/network-map` | **Network Map** | Full-viewport network visualization with local mock topology, layer controls, asset search, and map tools; optional Mapbox basemap |
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

### Installation

1. **Install dependencies:**

   ```bash
   yarn install
   ```

2. **Optional map setup:**

   Add a Mapbox token only if you want the online basemap in the network map:

   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   ```

3. **Start the development server:**

   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The app starts directly; local mock API routes are available immediately.

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

**Data flow:** UI hooks in `src/modules/*/hooks/` call `apiClient` against `/api/*`. The catch-all handler at `src/app/api/[...path]/route.ts` delegates to `src/mocks/apiRouter.ts`. Report-specific routes under `src/app/api/reports/` use the same mock data layer.

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

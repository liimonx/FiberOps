# FiberOps

**FiberOps** is a production-grade telecom network operations dashboard designed to map every fiber route, pole, junction box, splitter, ONU, POP, and customer connection in one live system.

## 🚀 Overview

The purpose of FiberOps is to provide an enterprise-grade GIS dashboard for:

- Visualizing fiber network infrastructure
- Monitoring network health
- Managing assets
- Tracking incidents
- Planning network expansion
- Connecting customer topology to the physical network

This frontend is built with a **frontend-first architecture** using mocked data via MSW and modular API adapters, ready to be connected to a production backend.

**Backend implementers:** see [docs/backend/README.md](./docs/backend/README.md) for the full API contract, domain models, WebSocket protocol, database schema, and frontend integration guide.

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI System:** `@shohojdhara/atomix`
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Maps:** Mapbox GL JS
- **Forms & Validation:** React Hook Form + Zod
- **Mock API:** MSW (Mock Service Worker)
- **Animation:** GSAP
- **Icons:** Phosphor Icons (`@phosphor-icons/react`)
- **Code Quality:** ESLint + Prettier

## 📦 Key Modules

- **Dashboard:** KPI cards, outage feed, technician widget, fiber usage/revenue charts, mini network map, and work order summary.
- **Network Map:** Flagship full-viewport GIS canvas with layer controls, asset search, route tracing, heat maps, and measurement tools.
- **Assets:** Manage and view details, maintenance timelines, connection graphs, and status logs for all physical assets.
- **Customers:** Searchable profiles, signal health monitoring, connection path tracing, and incident history.
- **Incidents:** Track and resolve network issues with severity filters, map pinpoints, and status timelines.
- **Work Orders:** Kanban-style board (New / Assigned / In Progress / Review / Done) for managing technician tasks.
- **Planning, Reports & Settings:** Additional modules for comprehensive network management.

## 🚀 Getting Started

### Prerequisites

- Node.js LTS
- Yarn
- Mapbox Access Token

### Installation

1. **Install dependencies:**

   ```bash
   yarn install
   ```

2. **Environment Setup:**
   Create a `.env.local` file in the root directory and add your Mapbox access token:

   ```env
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   ```

3. **Start the Development Server:**
   ```bash
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📐 Architecture

- `src/app/` - Next.js App Router pages, layouts, and global styles.
- `src/components/` - Reusable UI primitives (no business logic).
- `src/patterns/` - Composite reusable sections (e.g., Shell).
- `src/modules/` - Feature-owned code (network-map, etc.), including its own stores, hooks, and utilities.
- `src/services/` - API adapter layer with repository interfaces and mock implementations.
- `src/mocks/` - MSW handlers and mock telecom datasets.
- `src/types/` - Strict TypeScript domain models.

## 🎨 Design Direction

The UI reflects a **premium telecom software** feel:

- Clean, modern, and operational
- Low visual noise with a crisp, technical tone
- Subtle, meaningful, and performant motion (GSAP)
- Strict adherence to the `@shohojdhara/atomix` design system

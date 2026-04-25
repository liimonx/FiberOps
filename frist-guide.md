# BCN FiberOps — Frontend Build Spec (AI Agent)

## Project

Build a **production-grade telecom network operations dashboard** called:

**BCN FiberOps**

Purpose:

* visualize fiber network infrastructure
* monitor network health
* manage assets
* track incidents
* plan expansion
* connect customer topology to physical network

Backend API will be built later in **Laravel**.

Current objective:

> **Frontend-first architecture with mocked data and modular API adapters.**

---

## User steps (task checklist)

Use this as the execution plan to build the frontend from zero to “handoff ready”.

### 0) Prerequisites

- [ ] **Install tooling**: Node.js LTS, pnpm (preferred) or npm, git
- [ ] **Get Mapbox token**: create a Mapbox access token (needed for `Mapbox GL JS`)

### 1) Bootstrap the app

- [ ] **Create Next.js app** (App Router + TypeScript)
- [ ] **Create `src/` structure** exactly as specified under “App architecture”
- [ ] **Add base env**:
  - [ ] create `.env.local`
  - [ ] set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...`

### 2) Install and wire core dependencies

- [ ] **Install UI + styling**: `@shohojdhara/atomix`, SCSS Modules
- [ ] **Install state/data**: Zustand, TanStack Query
- [ ] **Install forms/validation**: React Hook Form, Zod
- [ ] **Install map/charts/motion**: Mapbox GL JS, Atomix chart components, GSAP
- [ ] **Install icons/table**: Lucide, Atomix DataGrid
- [ ] **Install mocking**: MSW (with realistic latency + datasets)
- [ ] **Configure code quality**: ESLint + Prettier

### 3) App foundation (global)

- [ ] **Theme + tokens** in `src/foundation/` (Atomix token-driven)
- [ ] **App providers**: QueryClientProvider, global layout shell, toasts/notifications (if needed)
- [ ] **Navigation shell**: Topbar + Sidebar + Main content + Inspector drawer + Activity panel
- [ ] **Routing**: add routes listed in “Routes” using App Router

### 4) Domain model + mock data

- [ ] **Create strict types** in `src/types/`:
  - [ ] `Asset`, `FiberRoute`, `FiberCore`, `Customer`, `Incident`, `WorkOrder`, `Technician`, `Zone`, `Alert`
- [ ] **Create telecom datasets** in `src/mocks/`:
  - [ ] 500+ customers
  - [ ] 2000+ poles/assets
  - [ ] routes + incidents + live alerts
- [ ] **MSW handlers** with latency simulation and realistic pagination/filtering patterns

### 5) API adapter layer (future-proof)

- [ ] **Define repository interfaces** in `src/services/`:
  - [ ] `AssetRepository`, `IncidentRepository`, `CustomerRepository` (and others as needed)
- [ ] **Implement mock adapters** that satisfy the interfaces
- [ ] **Stub Laravel adapters** (empty/throwing implementations) so the swap is obvious later
- [ ] **Use adapters everywhere** (no direct mock imports inside UI)

### 6) UI building blocks

- [ ] **`src/components/`**: primitives only (no business logic)
- [ ] **`src/patterns/`**: composite layout sections (Shell, PageHeader, Inspector, MapToolbar, etc.)
- [ ] **Accessibility**: keyboard navigation, focus states, ARIA for controls, sensible empty states

### 7) Feature modules (deliverable pages)

- [ ] **Dashboard (`src/modules/dashboard/`)**
  - [ ] KPI cards, outage feed, technician widget, usage + revenue charts, mini map, work order summary
- [ ] **Network Map (`src/modules/network-map/`)**
  - [ ] fullscreen GIS canvas, layers, search, zoom, route trace, inspector, heatmap, measurement tool
  - [ ] render mock GeoJSON and ensure performance (memoize heavy rendering)
- [ ] **Assets (`src/modules/assets/`)**
  - [ ] asset table (DataGrid), detail view, maintenance timeline, connection graph, photos, status logs
- [ ] **Customers (`src/modules/customers/`)**
  - [ ] searchable table, profile, signal health, connection path, billing badge, incident history
- [ ] **Incidents (`src/modules/incidents/`)**
  - [ ] list, severity filters, map pinpoint, assignment, status timeline, resolution notes
- [ ] **Work Orders (`src/modules/work-orders/`)**
  - [ ] kanban (New/Assigned/In Progress/Review/Done) with drag-drop
- [ ] **Planning / Reports / Settings**
  - [ ] implement initial “v1” screens (structure + mock data) to complete navigation and shell flow

### 8) Production readiness checks

- [ ] **Type safety**: no `any`, strict TS, stable module boundaries
- [ ] **Performance**: avoid unnecessary rerenders; optimize map layers; virtualize large tables if needed
- [ ] **Responsiveness**: desktop-first shell, graceful tablet sizing, minimum viable mobile layout
- [ ] **Build sanity**: `lint`, `typecheck`, `build` all pass

---

# Core stack

Use:

```yaml
Framework: Next.js (App Router)
Language: TypeScript
UI System: @shohojdhara/atomix
Styling: SCSS Modules + Atomix tokens
State: Zustand
Data fetching: TanStack Query
Forms: React Hook Form + Zod
Map: Mapbox GL JS
Charts: Atomix chart components (@shohojdhara/atomix)
Animation: GSAP
Icons: Lucide
Table: Atomix DataGrid
Mock API: MSW
Validation: Zod
Code quality: ESLint + Prettier
```

Requirements:

* responsive
* production-ready
* scalable
* strongly typed
* accessibility considered
* reusable patterns
* design token driven

---

# Design direction

Visual language:

> enterprise GIS dashboard
> premium telecom software
> clean / modern / operational

Inspiration:

* Datadog
* Linear
* Cisco dashboards
* ArcGIS

Tone:

* serious
* technical
* crisp
* low visual noise
* fast

Motion:

* subtle
* meaningful
* performant

Use GSAP sparingly:

* path pulse
* live node glow
* inspector transitions
* metric count animations

Avoid:

* flashy motion
* gradients everywhere
* glassmorphism
* marketing-site aesthetics

---

# App architecture

Create:

```txt
src/
 ├── app/
 ├── foundation/
 ├── components/
 ├── patterns/
 ├── modules/
 ├── services/
 ├── stores/
 ├── hooks/
 ├── mocks/
 ├── types/
 ├── utils/
 └── config/
```

---

## foundation/

Contains:

* theme
* tokens
* spacing
* typography
* z-index
* motion presets
* icon registry

---

## components/

Reusable UI primitives only.

Examples:

```txt
Card
StatCard
Metric
Badge
StatusDot
DataTable
Tabs
Drawer
Modal
SearchInput
FilterBar
MapLegend
Tooltip
Timeline
EmptyState
```

No business logic.

---

## patterns/

Composite reusable sections.

Examples:

```txt
DashboardShell
PageHeader
SidebarNavigation
AssetInspector
MetricGrid
SplitView
MapToolbar
FilterPanel
CommandPalette
ActivityFeed
```

---

## modules/

Feature-owned code.

Modules:

```txt
dashboard/
network-map/
assets/
customers/
incidents/
work-orders/
planning/
reports/
settings/
```

Each module owns:

```txt
components/
hooks/
services/
types/
store/
views/
mock/
```

---

# Routes

Implement:

```txt
/
 /dashboard
 /network-map
 /assets
 /customers
 /incidents
 /work-orders
 /planning
 /reports
 /settings
```

Use:
App Router

---

# Layout

Desktop shell:

```txt
Topbar
Left sidebar
Main content
Right inspector drawer
Bottom activity panel
```

Persistent shell.

No page reload feeling.

---

# Pages

## Dashboard

Build:

* KPI cards
* outage feed
* live technician widget
* fiber usage chart
* revenue chart
* mini network map
* work order summary

---

## Network Map

Main flagship page.

Must include:

* full viewport GIS canvas
* layer controls
* asset search
* zoom controls
* route tracing
* selection inspector
* heat map mode
* measurement tool

Mock geojson.

---

## Assets

Build:

* asset table
* asset detail page
* maintenance timeline
* connection graph
* photos
* status logs

---

## Customers

Build:

* searchable table
* customer profile
* signal health
* connection path
* billing badge
* incident history

---

## Incidents

Build:

* incident list
* severity filters
* map pinpoint
* assigned technician
* status timeline
* resolution note panel

---

## Work Orders

Build kanban:

* New
* Assigned
* In Progress
* Review
* Done

Drag-drop supported.

---

# Domain types

Create strict types:

```ts
Asset
FiberRoute
FiberCore
Customer
Incident
WorkOrder
Technician
Zone
Alert
```

No any.

---

# Mocking strategy

Use MSW.

Create:

* realistic telecom dataset
* 500+ customers
* 2000+ poles
* routes
* incidents
* live alerts

Simulate latency.

---

# API layer

Create adapter pattern:

```ts
interface AssetRepository {}
interface IncidentRepository {}
interface CustomerRepository {}
```

Implement:

```txt
mock adapter
future laravel adapter
```

Swappable.

---

# Code style

Rules:

* small files
* single responsibility
* hooks first
* no prop drilling
* container/presenter split
* co-locate feature logic
* memoize heavy map rendering
* avoid unnecessary rerenders

Naming:
clear + domain-first.

Examples:

```txt
FiberRouteLayer
IncidentMarker
AssetHealthCard
CustomerConnectionTrace
```

---

# Output expectation

Generate:

* complete folder structure
* typed architecture
* mocked dataset
* polished UI
* enterprise-grade component quality
* maintainable codebase

Goal:

> make BCN FiberOps feel like premium internal telecom software.

# BCN FiberOps — UI & Component Implementation Guide (AI Agent)

## Project Context
This guide extends `frist-guide.md` and provides detailed rules for implementing the user interface for **BCN FiberOps** using the `@shohojdhara/atomix` design system.

---

## 1. Component Architecture

### The "Atomix First" Rule
Before building a custom component, **always** check if `@shohojdhara/atomix` has an existing primitive. 
* Do not reinvent buttons, cards, inputs, modals, or datagrids.
* Use polymorphic props (`as` or `LinkComponent`) when integrating with Next.js App Router `<Link>`.

### Component Categories
* **Primitives (`src/components/`)**: Wrappers around Atomix components configured with BCN FiberOps default props (e.g., specific sizing, variants). No domain data (e.g., `FiberCore` or `Incident`) should enter these components.
* **Domain Components (`src/modules/*/components/`)**: Components that accept domain models (e.g., `AssetHealthCard` taking an `Asset` object). These should compose primitives.
* **Layouts & Shells (`src/patterns/`)**: Structural components like `DashboardShell`, `InspectorDrawer`, and `MapToolbar`.

---

## 2. Styling Rules (Strict Atomix Compliance)

### Utility Classes ONLY
Use Atomix utility classes (`.u-*`) for all layout, spacing, typography, and alignment.
* **Allowed**: `<div className="u-flex u-flex-column u-gap-4 u-p-4">`
* **Forbidden**: Inline styles (`style={{ display: 'flex' }}`) or custom CSS files (`.custom-wrapper { display: flex; }`) unless doing complex Mapbox overlay positioning or GSAP animations.

### Glassmorphism & Premium Feel
FiberOps is an enterprise dashboard. It needs to feel premium.
* Use the `glass={true}` prop on `Card`, `Panel`, and `Drawer` components wherever overlapping the Mapbox canvas.
* Maintain high contrast for accessibility while keeping the technical/dark mode aesthetic.

### Typography
* Rely exclusively on Atomix typography utilities (`u-fs-sm`, `u-font-bold`, `u-text-secondary-subtle`).
* Use mono-spaced fonts for technical data (MAC addresses, IP addresses, coordinates).

---

## 3. Data Visualization & Tables

### Atomix DataGrid
* Use `DataGrid` for all tabular data (Customers, Assets, Incidents).
* Enable virtualization for tables exceeding 100 rows to maintain performance.
* Build custom cell renderers using Atomix badges (`<Badge variant="success">Active</Badge>`).

### Charts
* Use Atomix chart components for Dashboard metrics (fiber usage, revenue).
* Ensure charts are responsive and respect the current theme (dark/light mode).

---

## 4. Animation Guidelines (GSAP)

Use GSAP for meaningful motion, not just decoration.

* **Map Interactions**: Animate the zooming and panning smoothly. Pulse markers for active incidents.
* **Data Flow**: Use subtle SVG line animations to show signal flow in the `CustomerConnectionTrace` component.
* **Layout Shifts**: Animate the `InspectorDrawer` sliding in/out over the map canvas to maintain spatial context.
* **Rules**:
  * Keep durations under `300ms` for UI interactions.
  * Use ease-out functions (`power2.out`) for entering elements, and ease-in (`power2.in`) for exiting elements.

---

## 5. Accessibility (A11y)

* **Keyboard Navigation**: Ensure all custom `MapToolbar` controls and `CommandPalette` items are fully keyboard navigable.
* **ARIA Attributes**: When combining Atomix primitives into complex patterns (like a multi-step work order form), manage `aria-expanded`, `aria-hidden`, and `aria-live` correctly.

---

## Output Expectations

When executing a UI task:
1. Identify the required Atomix primitives.
2. Structure the layout using `.u-*` utility classes.
3. Compose into a Domain Component.
4. Integrate with the Page/Module layout.
5. Verify responsiveness (Desktop -> Tablet).

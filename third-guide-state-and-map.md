# BCN FiberOps — State Management & Map Architecture Guide (AI Agent)

## Project Context
This guide extends `frist-guide.md` and defines the strict patterns for handling application state, data fetching, and the integration of Mapbox GL JS in **BCN FiberOps**.

---

## 1. State Management Split

State in FiberOps is strictly separated into two categories: **Server State** and **Client/UI State**.

### Server State (TanStack Query)
Any data that resides on the server (or in our MSW mocks) must be managed by TanStack Query.
* **Entities**: Assets, Customers, Incidents, Work Orders.
* **Rules**:
  * Never store fetched data in Zustand or React Context.
  * Use custom hooks to wrap `useQuery` and `useMutation` (e.g., `useIncidents()`, `useUpdateAsset()`).
  * Implement optimistic updates for critical UI actions (e.g., changing a Work Order status).
  * Configure realistic cache times (e.g., `staleTime: 5 * 60 * 1000` for assets, `staleTime: 10 * 1000` for active alerts).

### Client / UI State (Zustand)
Any state that controls the user interface or local ephemeral data must be managed by Zustand.
* **Entities**: Selected map layer, active inspector panel, sidebar expanded/collapsed state, map viewport coordinates.
* **Rules**:
  * Create granular stores (e.g., `useMapStore`, `useInspectorStore`) rather than one massive global store.
  * Avoid placing complex nested objects in Zustand if they are frequently updated; prefer flat state structures.

---

## 2. API Adapters & Mocking

### Adapter Pattern
We isolate the UI from the backend implementation using Repositories.
* All data fetching happens via Repository classes or functions in `src/services/`.
* The `useQuery` hooks call these repositories, not `fetch` or `axios` directly.

### MSW Implementation
* MSW handlers in `src/mocks/handlers.ts` must simulate network latency (`delay(500)` to `delay(2000)`).
* Implement pagination, filtering, and sorting in the MSW handlers to ensure the frontend is built to handle real-world API constraints.

---

## 3. Mapbox GL JS Architecture

The Network Map is the flagship feature. Its implementation must be highly performant and modular.

### Initialization & Lifecycle
* Initialize the Mapbox instance exactly once. Store the reference in a React `useRef` or a specific Zustand `useMapStore` to make it accessible to sibling components without prop drilling.
* Ensure proper cleanup (`map.current.remove()`) on component unmount to prevent memory leaks.

### Layers & Sources Architecture
* Do not keep massive GeoJSON objects in React state.
* **Sources**: Add GeoJSON data directly to Mapbox sources (`map.getSource('assets').setData(...)`).
* **Layers**: Define layers (Lines for fiber, Circles for assets/poles) declaratively.
* Use React components strictly to manage the *lifecycle* of the Mapbox layers, not to render them via DOM elements. (Consider using `react-map-gl` if it simplifies this, but raw Mapbox GL JS wrapped in `useEffect` hooks often provides better performance for complex enterprise GIS).

### Event Handling
* **Click Events**: When a user clicks an asset on the map, update the `useInspectorStore` with the selected `assetId`. The `InspectorDrawer` component will then react to this ID, fetching the full asset details via TanStack Query.
* **Hover Events**: Use Mapbox feature states (`map.setFeatureState`) to highlight elements on hover, rather than updating React state, to ensure 60fps performance.

---

## Output Expectations

When implementing data or map features:
1. Define the TypeScript types for the domain entity.
2. Implement the MSW mock handler with latency.
3. Write the Repository adapter.
4. Create the TanStack Query hook.
5. Bind to the UI (or Mapbox layer).
6. Verify no unnecessary React renders occur when interacting with the map.

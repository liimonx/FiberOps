# Network Map UI Redesign Specification

## Requirement Overview
Complete redesign of the network-map page UI using Atomix design system components to create a comprehensive, responsive, and accessible network visualization interface.

## Current State Analysis
- **Current Implementation**: Basic placeholder with Mapbox GL JS integration planned
- **Design System**: Atomix (@shohojdhara/atomix) in use
- **Layout Structure**: 4-panel layout (search toolbar, layer controls, inspector panel, map canvas)
- **Missing Elements**: Actual map integration, data visualization, interaction handlers

## Architecture & Technical Approach

### UI Component Hierarchy
```
NetworkMapPage
├── MapCanvas (Mapbox GL JS integration)
├── SearchPanel 
├── Toolbar (interaction tools)
├── LayerControls (visibility toggles)
├── InspectorPanel (asset details)
├── StatusIndicators (real-time network status)
└── ContextualTooltips (hover interactions)
```

### Responsive Design Strategy
- **Desktop**: Full 4-panel layout with side-by-side inspector
- **Tablet**: Collapsible inspector panel for more map space
- **Mobile**: Full-screen map with bottom sheet controls

### Color Scheme Implementation
- **Active**: Green variants for operational assets
- **Inactive**: Gray variants for offline/disabled assets  
- **Warning**: Orange/yellow for degraded performance
- **Error**: Red for failures/outages

## Affected Files & Modification Scope

### Primary Files to Modify
- `/src/app/network-map/page.tsx` - Main page component (full rewrite)
- `/src/modules/network-map/` - Create new map-specific components
- `/src/components/` - Add reusable network visualization components

### New Component Files to Create
- `NetworkMap.tsx` - Core map visualization component
- `NetworkNode.tsx` - Individual node visualization
- `NetworkConnection.tsx` - Fiber route/connection display
- `StatusIndicator.tsx` - Network status badges
- `InteractiveTooltip.tsx` - Hover/focus tooltips
- `LoadingState.tsx` - Data loading indicators

## Implementation Details

### Core UI Components

#### 1. MapCanvas Component
```jsx
// Responsive Mapbox GL JS container with proper lifecycle management
const MapCanvas = () => {
  // Mapbox initialization, cleanup, event handlers
  // Responsive sizing for desktop/tablet/mobile
  // Performance optimization for 60fps rendering
};
```

#### 2. Navigation Panel
- Collapsible panel with search functionality
- Asset categorization (nodes, splitters, routes)
- Quick filter controls
- Search history and suggestions

#### 3. Node Visualization Controls
- Zoom-dependent detail levels
- Cluster/expand behavior at different scales
- Status-appropriate styling and animations
- Selection/highlight states

#### 4. Connection Status Indicators
- Real-time line animations for active connections
- Color-coded status (active/warning/error)
- Bandwidth/utilization visualization
- Outage detection and alerting

### Responsive Behavior

#### Desktop (> 1024px)
- Full layout with all panels visible
- Inspector panel fixed-width (320px)
- Toolbar and controls always accessible

#### Tablet (768px - 1024px)  
- Collapsible inspector (slide-out panel)
- Reduced spacing between controls
- Touch-friendly button sizing

#### Mobile (< 768px)
- Full-screen map mode
- Bottom sheet for controls and inspector
- Gesture-based navigation
- Optimized for single-handed use

### Accessibility Features

#### Keyboard Navigation
- Tab-accessible controls with proper focus management
- Arrow key map navigation (pan/zoom)
- Keyboard shortcuts for common actions
- Screen reader announcements for map interactions

#### Screen Reader Support
- Semantic HTML structure for all components
- ARIA labels for map features and controls
- Live regions for status updates
- Proper heading hierarchy

### Loading States & Error Handling

#### Loading Indicators
- Skeleton screens for initial data load
- Progressive loading for large datasets
- Map tile loading states
- Async operation progress indicators

#### Error States
- Network connectivity loss handling
- Map service failure fallbacks
- Graceful degradation for missing data
- User-friendly error messages with recovery options

## Data Flow & State Management

### Client-Side State (Zustand)
```typescript
interface NetworkMapState {
  viewport: ViewportState;
  selectedAsset: Asset | null;
  activeLayers: string[];
  searchQuery: string;
  activeTool: ToolType;
  loading: boolean;
  errors: string[];
}
```

### Server-Side State (TanStack Query)
- Assets data fetching and caching
- Real-time status updates via WebSocket
- Historical data for trend visualization

## Performance Considerations

### Map Rendering Optimization
- Feature state management for minimal React re-renders
- Proper Mapbox layer organization
- Zoom-level dependent feature loading
- Memory management for large datasets

### Interaction Performance
- Debounced search and filter operations
- Responsive design without layout thrashing
- Optimized animation frames
- Efficient event handling

## Implementation Priorities

### Phase 1: Foundation (Week 1)
1. Mapbox GL JS integration with basic rendering
2. Core Atomix component integration
3. Responsive layout foundation
4. Basic state management setup

### Phase 2: Interaction (Week 2)  
1. Node selection and highlighting
2. Search and filter functionality
3. Tool interactions (select, trace, measure)
4. Layer control implementation

### Phase 3: Polish (Week 3)
1. Animation and transitions
2. Advanced styling and theming
3. Accessibility features
4. Error handling and loading states

## Expected Outcomes

### Functional Requirements
- ✅ Full Mapbox GL JS integration with actual network data
- ✅ Responsive design across all device sizes
- ✅ Comprehensive accessibility support
- ✅ Real-time status visualization
- ✅ Interactive tool functionality

### User Experience Requirements
- ✅ Intuitive navigation and interaction patterns
- ✅ Fast loading and smooth performance
- ✅ Clear visual hierarchy and information presentation
- ✅ Effective error communication and recovery

### Technical Requirements
- ✅ Proper component architecture and separation of concerns
- ✅ Efficient state management and data flow
- ✅ Maintainable and extensible code structure
- ✅ Comprehensive test coverage
"use client";

import {
  NetworkMapDataProvider,
  MapCanvas,
  SearchPanel,
  Toolbar,
  LayerControls,
  InspectorPanel,
  MapEventHandler,
} from "@/modules/network-map/components";
import {
  useNetworkMapStore,
  useNodes,
  useConnections,
  useSelectedNode,
  useInteraction,
} from "@/modules/network-map/stores/useNetworkMapStore";
import { SearchResult } from "@/modules/network-map/types";
import { flyToLocation } from "@/modules/network-map/components/MapEventHandler";

// Wrapper component to access store hooks
function NetworkMapContent() {
  const nodes = useNodes();
  const connections = useConnections();
  const selectedNode = useSelectedNode();
  
  const setSelectedElement = useNetworkMapStore(
    (state) => state.setSelectedElement
  );
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);
  const setSearchQuery = useNetworkMapStore((state) => state.setSearchQuery);

  const handleSelectResult = (result: SearchResult) => {
    setSelectedElement(result.id);
    // Focus on the selected element on the map
    flyToLocation([result.id.includes('node') ? -74.0060 : -74.0050, result.id.includes('node') ? 40.7128 : 40.7138], 14);
  };

  const handleCloseInspector = () => {
    setSelectedElement(null);
  };

  const handleNavigate = (
    elementId: string,
    type: "node" | "connection"
  ) => {
    setSelectedElement(elementId);
    // Navigate to the element on the map
    const node = nodes.find(n => n.id === elementId);
    if (node) {
      flyToLocation([node.position.lng, node.position.lat], 15);
    }
  };

  const handleTracePath = (elementId: string) => {
    // Trigger path tracing logic
    console.log("Tracing path for:", elementId);
    setActiveTool('trace');
  };

  return (
    <div
      className="u-w-100 u-h-100 u-relative u-bg-dark u-overflow-hidden u-z-1"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      {/* Map Canvas */}
      <MapCanvas />

      {/* Map Event Handler for interactions */}
      <MapEventHandler />

      {/* Search Panel - Top Left */}
      <div className="u-absolute u-top-0 u-start-0 u-pointer-events-auto">
        <SearchPanel
          nodes={nodes}
          connections={connections}
          onSelectResult={handleSelectResult}
          isOpen={true}
        />
      </div>

      {/* Toolbar - Top Right */}
      <Toolbar position="top-right" />

      {/* Layer Controls - Bottom Left */}
      <div className="u-absolute u-bottom-0 u-start-0 u-pointer-events-auto ">
        <LayerControls />
      </div>

      {/* Inspector Panel - Right Side */}
      <div
        className="u-absolute u-top-0 u-end-0 u-pointer-events-auto"
        style={{ maxHeight: "calc(100vh - 96px)" }}
      >
        <InspectorPanel
          selectedNode={selectedNode || null}
          selectedConnection={null}
          onClose={handleCloseInspector}
          onNavigate={handleNavigate}
          onTracePath={handleTracePath}
        />
      </div>
    </div>
  );
}

export default function NetworkMapPage() {
  return (
    <NetworkMapDataProvider>
      <NetworkMapContent />
    </NetworkMapDataProvider>
  );
}

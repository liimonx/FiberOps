"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { Card, Icon, Button } from "@shohojdhara/atomix";
import {
  NetworkMapDataProvider,
  MapCanvas,
  SearchPanel,
  Toolbar,
  LayerControls,
  InspectorPanel,
  MapEventHandler,
  MapControls,
  InteractiveTooltip,
  createNodeTooltipContent,
  createConnectionTooltipContent,
} from "@/modules/network-map/components";
import type { TooltipContent } from "@/modules/network-map/components";
import {
  useNetworkMapStore,
  useNodes,
  useConnections,
  useSelectedNode,
  useConnectionById,
} from "@/modules/network-map/stores/useNetworkMapStore";
import {
  SearchResult,
  NetworkNode,
  NetworkConnection,
} from "@/modules/network-map/types";
import { CategorizedResult } from "@/modules/network-map/hooks/useAssetSearch";
import { flyToLocation } from "@/modules/network-map/components/MapEventHandler";
import { getMapInstance } from "@/modules/network-map/components/MapCanvas";
import {
  MeasurementOverlay,
  TracePathOverlay,
  HeatmapLegend,
} from "@/modules/network-map/components/MeasurementOverlay";
import { ToolVisualizations } from "@/modules/network-map/components/ToolVisualizations";

// Wrapper component to access store hooks
function NetworkMapContent() {
  const nodes = useNodes();
  const connections = useConnections();
  const selectedNode = useSelectedNode();
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);

  const selectedElementId = useNetworkMapStore(
    (state) => state.interaction.selectedElementId
  );
  const setSelectedElement = useNetworkMapStore((state) => state.setSelectedElement);
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);
  const addToSelectionHistory = useNetworkMapStore(
    (state) => state.addToSelectionHistory
  );

  // Track the live map instance for ToolVisualizations
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  useEffect(() => {
    // Poll until the map is ready (MapCanvas mounts it asynchronously)
    const interval = setInterval(() => {
      const map = getMapInstance();
      if (map) {
        setMapInstance(map);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Resolve selected connection from store
  const selectedConnection = useConnectionById(selectedNode ? null : selectedElementId);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    content: TooltipContent;
    x: number;
    y: number;
  } | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  // Handle search result selection — fly to actual node coordinates
  const handleSelectResult = useCallback(
    (result: CategorizedResult) => {
      setSelectedElement(result.id);
      addToSelectionHistory(result.id);

      // Look up the actual node position
      const node = nodes.find((n) => n.id === result.id);
      if (node) {
        flyToLocation([node.position.lng, node.position.lat], 15);
      }
    },
    [nodes, setSelectedElement, addToSelectionHistory]
  );

  const handleCloseInspector = useCallback(() => {
    setSelectedElement(null);
  }, [setSelectedElement]);

  const handleNavigate = useCallback(
    (elementId: string, type: "node" | "connection") => {
      setSelectedElement(elementId);
      addToSelectionHistory(elementId);

      const node = nodes.find((n) => n.id === elementId);
      if (node) {
        flyToLocation([node.position.lng, node.position.lat], 15);
      }
    },
    [nodes, setSelectedElement, addToSelectionHistory]
  );

  const handleTracePath = useCallback(
    (elementId: string) => {
      console.log("Tracing path for:", elementId);
      setActiveTool("trace");
    },
    [setActiveTool]
  );

  // Tooltip handlers wired to MapEventHandler
  const handleNodeHover = useCallback(
    (nodeId: string | null, event: mapboxgl.MapMouseEvent) => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }

      if (!nodeId) {
        tooltipTimeoutRef.current = setTimeout(() => setTooltip(null), 150);
        return;
      }

      const node = nodes.find((n) => n.id === nodeId);
      if (node && event.point) {
        setTooltip({
          content: createNodeTooltipContent(node),
          x: event.point.x,
          y: event.point.y,
        });
      }
    },
    [nodes]
  );

  // Node click → behaviour depends on active tool
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      // Trace and Measure tools handle their own click logic via ToolManager.
      // Don't override their state by forcing a selection/fly-to here.
      if (activeTool === "trace" || activeTool === "measure") return;

      setSelectedElement(nodeId);
      addToSelectionHistory(nodeId);

      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        flyToLocation([node.position.lng, node.position.lat], 15);
      }
    },
    [activeTool, nodes, setSelectedElement, addToSelectionHistory]
  );

  // Connection click → select
  const handleConnectionClick = useCallback(
    (connectionId: string) => {
      setSelectedElement(connectionId);
      addToSelectionHistory(connectionId);
    },
    [setSelectedElement, addToSelectionHistory]
  );

  // Clean up tooltip timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="network-map-page">
      {/* Map Canvas - Full Screen Background */}
      <MapCanvas />

      {/* Map Event Handler for click/hover interactions */}
      <MapEventHandler
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onConnectionClick={handleConnectionClick}
      />

      {/* Floating UI Panels */}
      <div className="map-overlay">
        {/* Search Panel — Top Left */}
        <div className="overlay-top-left">
          <SearchPanel
            nodes={nodes}
            connections={connections}
            onSelectResult={handleSelectResult}
          />
        </div>

        {/* Toolbar — Top Right */}
        <div className="overlay-top-right">
          <Toolbar position="top-right" />
        </div>

        {/* Map Controls (Zoom/Compass) — Right Side, below Toolbar */}
        <div className="overlay-bottom-right">
          <MapControls position="bottom-right" />
        </div>

        {/* Layer Controls — Bottom Left */}
        <div className="overlay-bottom-left">
          <LayerControls />
        </div>

        {/* Inspector Panel — Right Side, below controls */}
        {(selectedNode || selectedConnection) && (
          <div className="overlay-inspector">
            <InspectorPanel
              selectedNode={selectedNode || null}
              selectedConnection={selectedConnection || null}
              onClose={handleCloseInspector}
              onNavigate={handleNavigate}
              onTracePath={handleTracePath}
            />
          </div>
        )}
        <div className="overlay-bottom-center">
          {/* Tool overlays — shown when the relevant tool is active */}
          {activeTool === "measure" && <MeasurementOverlay />}
          {activeTool === "trace" && <TracePathOverlay />}
          {activeTool === "heatmap" && <HeatmapLegend />}
        </div>

        {/* Zoom Level Indicator */}
        <ZoomLevelIndicator />
      </div>

      {/* Mapbox GL layer visualizations (measurement lines, trace path, heatmap) */}
      {mapInstance && <ToolVisualizations mapInstance={mapInstance} />}

      {/* Interactive Tooltip — follows mouse on hover */}
      {tooltip && !selectedNode && !selectedConnection && (
        <div
          className="map-tooltip-anchor"
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top: tooltip.y - 12,
            pointerEvents: "none",
          }}
        >
          <Card glass={{ blurAmount: 6, mode: "shader" }} className="tooltip-card">
            <div className="tooltip-body">
              <strong className="tooltip-title">{tooltip.content.title}</strong>
              {tooltip.content.subtitle && (
                <span className="tooltip-subtitle">{tooltip.content.subtitle}</span>
              )}
              {tooltip.content.details && tooltip.content.details.length > 0 && (
                <div className="tooltip-details">
                  {tooltip.content.details.map((detail, i) => (
                    <div key={i} className="tooltip-detail-row">
                      <span className="tooltip-detail-label">{detail.label}</span>
                      <span className="tooltip-detail-value">{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        .network-map-page {
          position: relative;
          width: 100%;
          flex: 1;
          min-height: 0;
          height: 100%;
          background: #111827;
          overflow: hidden;
        }

        .map-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .overlay-top-left {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 320px;
          pointer-events: auto;
        }

        .overlay-top-right {
          position: absolute;
          top: 16px;
          right: 16px;
          pointer-events: auto;
        }

        .overlay-bottom-right {
          position: absolute;
          bottom: 16px;
          right: 16px;
          pointer-events: auto;
        }

        .overlay-bottom-left {
          position: absolute;
          bottom: 16px;
          left: 16px;
          pointer-events: auto;
        }

        .overlay-bottom-center {
          position: absolute;
          width: 320px;
          bottom: 16px;
          left: calc(50% - 160px);
          pointer-events: auto;
        }

        .overlay-inspector {
          position: absolute;
          top: 30vh;
          right: 16px;
          overflow-y: auto;
          pointer-events: auto;
        }

        .tooltip-card {
          max-width: 280px;
          padding: 0;
          overflow: hidden;
        }

        .tooltip-body {
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tooltip-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-gray-100);
        }

        .tooltip-subtitle {
          font-size: 11px;
          color: var(--color-gray-400);
        }

        .tooltip-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: 4px;
          padding-top: 6px;
          border-top: 1px solid var(--color-gray-700);
        }

        .tooltip-detail-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 11px;
        }

        .tooltip-detail-label {
          color: var(--color-gray-500);
        }

        .tooltip-detail-value {
          color: var(--color-gray-200);
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .overlay-top-left {
            width: calc(100% - 80px);
            max-width: 280px;
          }

          .overlay-inspector {
            position: absolute;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 50vh;
          }

          .overlay-bottom-left {
            bottom: 8px;
            left: 8px;
          }
        }
      `}</style>
    </div>
  );
}

// Zoom level indicator component
function ZoomLevelIndicator() {
  const zoom = useNetworkMapStore((state) => state.viewport.zoom);

  return (
    <div className="zoom-indicator">
      <Icon name="MagnifyingGlassPlus" size={12} />
      <span>{zoom.toFixed(1)}</span>

      <style jsx>{`
        .zoom-indicator {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(17, 24, 39, 0.8);
          backdrop-filter: blur(4px);
          border-radius: 12px;
          border: 1px solid var(--color-gray-700);
          color: var(--color-gray-400);
          font-size: 11px;
          font-weight: 500;
          pointer-events: auto;
          user-select: none;
        }
      `}</style>
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

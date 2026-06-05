"use client";

import { useCallback, useMemo } from "react";
import { Icon } from "@shohojdhara/atomix";
import {
  NetworkMapDataProvider,
  MapCanvas,
  SearchPanel,
  MapToolbar,
  LayerControls,
  InspectorPanel,
  MapEventHandler,
  MapControls,
  InteractiveTooltip,
  ImpairmentAreaPanel,
} from "@/modules/network-map/components";
import {
  useNetworkMapStore,
  useNodes,
  useConnections,
  useSelectedNode,
  useConnectionById,
} from "@/modules/network-map/stores/useNetworkMapStore";
import { CategorizedResult } from "@/modules/network-map/types";
import { flyToLocation } from "@/modules/network-map/utils/mapUtils";
import { useMapInstance } from "@/modules/network-map/hooks/useMapInstance";
import { useMapHoverTooltip } from "@/modules/network-map/hooks/useMapHoverTooltip";
import {
  MeasurementOverlay,
  TracePathOverlay,
  HeatmapLegend,
} from "@/modules/network-map/components/MeasurementOverlay";
import { ToolVisualizations } from "@/modules/network-map/components/ToolVisualizations";

function NetworkMapContent() {
  const nodes = useNodes();
  const connections = useConnections();
  const selectedNode = useSelectedNode();
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);

  const selectedElementId = useNetworkMapStore(
    (state) => state.interaction.selectedElementId
  );
  const setSelectedElement = useNetworkMapStore((state) => state.setSelectedElement);
  const addToSelectionHistory = useNetworkMapStore(
    (state) => state.addToSelectionHistory
  );

  const mapInstance = useMapInstance();
  const selectedConnection = useConnectionById(selectedNode ? null : selectedElementId);

  const showHoverTooltip =
    activeTool === "select" && !selectedNode && !selectedConnection;

  const tooltipCallbacks = useMemo(
    () => ({
      onViewDetails: (id: string) => {
        setSelectedElement(id);
        addToSelectionHistory(id);
      },
      onTracePath: (nodeId: string) => {
        setActiveTool("trace");
        setSelectedElement(nodeId);
        addToSelectionHistory(nodeId);
      },
      onViewRoute: (connectionId: string) => {
        setSelectedElement(connectionId);
        addToSelectionHistory(connectionId);
      },
      onCheckHealth: (connectionId: string) => {
        setSelectedElement(connectionId);
        addToSelectionHistory(connectionId);
      },
    }),
    [setSelectedElement, addToSelectionHistory, setActiveTool]
  );

  const {
    tooltip,
    hoverTarget,
    handleNodeHover,
    handleConnectionHover,
    handleTooltipMouseEnter,
    handleTooltipMouseLeave,
  } = useMapHoverTooltip({
    nodes,
    connections,
    enabled: showHoverTooltip,
    callbacks: tooltipCallbacks,
  });

  const handleSelectResult = useCallback(
    (result: CategorizedResult) => {
      setSelectedElement(result.id);
      addToSelectionHistory(result.id);

      const node = nodes.find((n) => n.id === result.id);
      if (node) {
        flyToLocation(mapInstance, [node.position.lng, node.position.lat], 15);
      }
    },
    [nodes, setSelectedElement, addToSelectionHistory, mapInstance]
  );

  const handleCloseInspector = useCallback(() => {
    setSelectedElement(null);
  }, [setSelectedElement]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (activeTool === "trace" || activeTool === "measure") return;

      setSelectedElement(nodeId);
      addToSelectionHistory(nodeId);

      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        flyToLocation(mapInstance, [node.position.lng, node.position.lat], 15);
      }
    },
    [activeTool, nodes, setSelectedElement, addToSelectionHistory, mapInstance]
  );

  const handleConnectionClick = useCallback(
    (connectionId: string) => {
      setSelectedElement(connectionId);
      addToSelectionHistory(connectionId);
    },
    [setSelectedElement, addToSelectionHistory]
  );

  return (
    <div className="network-map-page">
      <MapCanvas />

      <MapEventHandler
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onConnectionClick={handleConnectionClick}
        onConnectionHover={handleConnectionHover}
      />

      <div className="map-overlay">
        <div className="overlay-top-left">
          <SearchPanel
            nodes={nodes}
            connections={connections}
            onSelectResult={handleSelectResult}
          />
        </div>

        <div className="overlay-top-right">
          <MapToolbar />
        </div>

        <div className="overlay-bottom-right">
          <ZoomLevelIndicator />
          <MapControls />
        </div>

        <div className="overlay-bottom-left">
          <LayerControls />
        </div>

        {(selectedNode || selectedConnection) && (
          <div className="overlay-inspector">
            <InspectorPanel
              selectedNode={selectedNode || null}
              selectedConnection={selectedConnection || null}
              onClose={handleCloseInspector}
            />
          </div>
        )}

        <div className="overlay-bottom-center">
          {activeTool === "measure" && <MeasurementOverlay />}
          {activeTool === "trace" && <TracePathOverlay />}
          {activeTool === "heatmap" && <HeatmapLegend />}
          {activeTool === "impairment" && <ImpairmentAreaPanel />}
        </div>
      </div>

      {mapInstance && <ToolVisualizations mapInstance={mapInstance} />}

      {showHoverTooltip && tooltip.content && (
        <InteractiveTooltip
          content={tooltip.content}
          node={hoverTarget.node ?? undefined}
          connection={hoverTarget.connection ?? undefined}
          visible={tooltip.visible}
          position={{ x: tooltip.x, y: tooltip.y }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        />
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
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
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

        @media (max-width: 768px) {
          .overlay-top-left {
            width: auto;
            max-width: calc(100% - 80px);
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

function ZoomLevelIndicator() {
  const zoom = useNetworkMapStore((state) => state.viewport.zoom);

  return (
    <div className="zoom-indicator">
      <Icon name="MagnifyingGlassPlus" size={12} />
      <span>{zoom.toFixed(1)}</span>

      <style jsx>{`
        .zoom-indicator {
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

"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapInstance } from "../hooks/useMapInstance";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { useAccessibilityAnnounce } from "./AccessibilityAnnouncer";
import { getToolManager } from "../tools/toolManager";
import { safeHasLayer, fitMapBounds, flyToLocation } from "../utils/mapUtils";
import {
  getNetworkQueryableLayers,
  isConnectionLayerId,
  isNodeLayerId,
} from "../utils/mapStyling/queryLayers";

interface MapEventHandlerProps {
  onNodeClick?: (nodeId: string, event: mapboxgl.MapMouseEvent) => void;
  onNodeHover?: (nodeId: string | null, event: mapboxgl.MapMouseEvent) => void;
  onConnectionClick?: (connectionId: string, event: mapboxgl.MapMouseEvent) => void;
  onConnectionHover?: (connectionId: string | null, event: mapboxgl.MapMouseEvent) => void;
  onMapClick?: (event: mapboxgl.MapMouseEvent) => void;
  onMapMove?: (event: mapboxgl.MapMouseEvent) => void;
}

export const MapEventHandler: React.FC<MapEventHandlerProps> = ({
  onNodeClick,
  onNodeHover,
  onConnectionClick,
  onConnectionHover,
  onMapClick,
  onMapMove,
}) => {
  const setSelectedElement = useNetworkMapStore((state) => state.setSelectedElement);
  const setHoveredElement = useNetworkMapStore((state) => state.setHoveredElement);
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const { announce } = useAccessibilityAnnounce();
  const prevToolRef = useRef(activeTool);

  const map = useMapInstance();

  // Sync tool manager with store's active tool (store is source of truth for UI)
  useEffect(() => {
    const toolManager = getToolManager();
    if (activeTool !== toolManager.getActiveTool()?.id) {
      toolManager.setActiveTool(activeTool, { syncStore: false });
    }
  }, [activeTool]);

  useEffect(() => {
    if (!map) return;
    const toolManager = getToolManager();

    const resolveCursor = (hasFeature: boolean): string => {
      const tool = toolManager.getActiveTool();
      if (!tool) return "";
      if (hasFeature && tool.id === "select") return "pointer";
      return tool.cursor ?? "";
    };



    // Handle map click events
    const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
      // Check if layers exist before querying
      let features: mapboxgl.MapboxGeoJSONFeature[] = [];
      const queryLayers = getNetworkQueryableLayers(map, safeHasLayer);
      if (queryLayers.length > 0) {
        features = map.queryRenderedFeatures(event.point, { layers: queryLayers });
      }

      // Delegate to ToolManager
      toolManager.handleEvent("onClick", {
        lngLat: event.lngLat,
        point: event.point,
        originalEvent: event.originalEvent,
        features: features,
      });

      // Still fire callbacks for external components if needed
      if (features.length > 0) {
        const feature = features[0];
        const elementId = feature.properties?.id;

        if (isNodeLayerId(feature.layer?.id)) {
          onNodeClick?.(elementId as string, event);
        } else if (isConnectionLayerId(feature.layer?.id)) {
          onConnectionClick?.(elementId as string, event);
        }
      } else {
        onMapClick?.(event);
      }
    };

    // Track hovered feature for state management
    let hoveredFeature: { id: string; source: string } | null = null;

    // Handle mouse move for hover effects
    const handleMouseMove = (event: mapboxgl.MapMouseEvent) => {
      // Check if layers exist before querying
      const layersToQuery = getNetworkQueryableLayers(map, safeHasLayer);
      if (layersToQuery.length === 0) return;

      const features = map.queryRenderedFeatures(event.point, {
        layers: layersToQuery,
      });

      // Clear previous hover state if different feature or no feature
      if (hoveredFeature) {
        map.setFeatureState(
          { source: hoveredFeature.source, id: hoveredFeature.id },
          { hover: false }
        );
      }

      if (features.length > 0) {
        const feature = features[0];
        const elementId = feature.properties?.id;

        if (!elementId) {
          hoveredFeature = null;
          setHoveredElement(null);
          onNodeHover?.(null, event);
          onConnectionHover?.(null, event);
          map.getCanvas().style.cursor = resolveCursor(false);
          return;
        }

        const source = feature.source || "network-nodes";
        hoveredFeature = { id: elementId, source };

        // Set new hover state
        map.setFeatureState(
          { source: source as string, id: elementId as string | number },
          { hover: true }
        );
        map.getCanvas().style.cursor = resolveCursor(true);

        if (isNodeLayerId(feature.layer?.id)) {
          setHoveredElement(elementId as string);
          onNodeHover?.(elementId as string, event);
          onConnectionHover?.(null, event);
        } else if (isConnectionLayerId(feature.layer?.id)) {
          setHoveredElement(elementId as string);
          onConnectionHover?.(elementId as string, event);
          onNodeHover?.(null, event);
        }
      } else {
        hoveredFeature = null;
        setHoveredElement(null);
        onNodeHover?.(null, event);
        onConnectionHover?.(null, event);
        map.getCanvas().style.cursor = resolveCursor(false);
      }
    };

    // Handle mouse leave to clear hover state
    const handleMouseLeave = () => {
      if (hoveredFeature) {
        map.setFeatureState(
          { source: hoveredFeature.source, id: hoveredFeature.id },
          { hover: false }
        );
        hoveredFeature = null;
      }
      setHoveredElement(null);
      onNodeHover?.(null, { point: { x: 0, y: 0 }, lngLat: { lng: 0, lat: 0 } } as mapboxgl.MapMouseEvent);
      onConnectionHover?.(null, { point: { x: 0, y: 0 }, lngLat: { lng: 0, lat: 0 } } as mapboxgl.MapMouseEvent);
      map.getCanvas().style.cursor = resolveCursor(false);
    };

    // Add event listeners
    map.on("click", handleMapClick);
    map.on("mousemove", handleMouseMove);
    map.on("mouseleave", handleMouseLeave);

    // Add keyboard navigation support
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!map) return;

      const baseMoveStep = 50; // pixels to move per key press
      const zoomStep = 0.5; // zoom level change per key press
      const fastMultiplier = event.shiftKey ? 3 : 1;
      const moveStep = baseMoveStep * fastMultiplier;

      // Don't intercept if typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          map.panBy([-moveStep, 0], { duration: 150, easing: (t) => t * (2 - t) });
          break;
        case "ArrowRight":
          event.preventDefault();
          map.panBy([moveStep, 0], { duration: 150, easing: (t) => t * (2 - t) });
          break;
        case "ArrowUp":
          event.preventDefault();
          map.panBy([0, -moveStep], { duration: 150, easing: (t) => t * (2 - t) });
          break;
        case "ArrowDown":
          event.preventDefault();
          map.panBy([0, moveStep], { duration: 150, easing: (t) => t * (2 - t) });
          break;
        case "+":
        case "=":
          event.preventDefault();
          const nextZoom = map.getZoom() + zoomStep;
          map.easeTo({ zoom: nextZoom, duration: 200 });
          announce(`Zoomed in to level ${nextZoom.toFixed(1)}`, "polite");
          break;
        case "-":
        case "_":
          event.preventDefault();
          const prevZoom = map.getZoom() - zoomStep;
          map.easeTo({ zoom: prevZoom, duration: 200 });
          announce(`Zoomed out to level ${prevZoom.toFixed(1)}`, "polite");
          break;
        case "0":
          event.preventDefault();
          map.resetNorth({ duration: 500 });
          announce("Map orientation reset to north", "polite");
          break;
        case "Escape":
          toolManager.handleEvent("onKeyDown", event);
          if (activeTool === "select") {
            setSelectedElement(null);
            setHoveredElement(null);
            announce("Selection cleared", "polite");
          }
          break;
        default:
          toolManager.handleEvent("onKeyDown", event);
          break;
      }
    };

    // Add keyboard event listener to the map container
    const mapContainer = map.getContainer();
    mapContainer.addEventListener("keydown", handleKeyDown);
    mapContainer.tabIndex = 0; // Make map focusable for keyboard navigation

    // ─────────────────────────────────────────────────────────────────────────
    // ANIMATION LOOP: Real-time map dynamics (Data flow & Status pulse)
    // ─────────────────────────────────────────────────────────────────────────
    let animationFrame: number;
    const startTime = Date.now();

    const animateMap = () => {
      // 1. Critical exit: Map instance doesn't exist or has been removed from DOM
      if (!map || !map.getContainer()) return;
      
      // 2. Skip frame if style is still loading or in transition
      if (!map.isStyleLoaded()) {
        animationFrame = requestAnimationFrame(animateMap);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      
      // Data flow animation placeholder (currently omitted to prevent property errors)
      
      try {
        // 3. Alert Pulse Animation: Safely update opacity of the glow layer
        const outageLayerId = "network-outages-glow";
        if (safeHasLayer(map, outageLayerId)) {
          const pulse = 0.4 + Math.sin(elapsed / 400) * 0.2; // Pulse between 0.2 and 0.6
          map.setPaintProperty(outageLayerId, "line-opacity", pulse);
        }

        const nodesGlowId = "network-nodes-glow";
        if (safeHasLayer(map, nodesGlowId) && map.getZoom() >= 9) {
          const pulseNodes = 0.28 + Math.sin(elapsed / 400) * 0.1;

          map.setPaintProperty(nodesGlowId, "circle-opacity", [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.55,
            ["==", ["get", "status"], "error"],
            pulseNodes,
            ["==", ["get", "status"], "warning"],
            pulseNodes * 0.75,
            0,
          ]);
        }
      } catch (error) {
        // Silently catch errors if style becomes unavailable during execution
        // This is common during rapid theme switching or hot reloads
        console.debug("[MapEventHandler] Animation frame skipped:", error);
      }

      animationFrame = requestAnimationFrame(animateMap);
    };

    // Start animation if map is ready
    if (map.isStyleLoaded()) {
      animateMap();
    } else {
      map.once('styledata', animateMap);
    }

    // Cleanup function
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (map) {
        map.off("click", handleMapClick);
        map.off("mousemove", handleMouseMove);
        map.off("mouseleave", handleMouseLeave);
      }

      if (mapContainer) {
        mapContainer.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [
    map,
    activeTool,
    setSelectedElement,
    setHoveredElement,
    onNodeClick,
    onNodeHover,
    onConnectionClick,
    onConnectionHover,
    onMapClick,
    onMapMove,
    announce,
  ]);

  // This component doesn't render anything visible
  return null;
};


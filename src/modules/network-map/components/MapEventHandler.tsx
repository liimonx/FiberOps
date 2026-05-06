"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { getMapInstance } from "./MapCanvas";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { useAccessibilityAnnounce } from "./AccessibilityAnnouncer";
import { getToolManager } from "../tools/toolManager";

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
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const { announce } = useAccessibilityAnnounce();
  const prevToolRef = useRef(activeTool);

  // Sync tool manager with store's active tool
  useEffect(() => {
    const toolManager = getToolManager();
    if (activeTool !== toolManager.getActiveTool()?.id) {
      toolManager.setActiveTool(activeTool);
    }
  }, [activeTool]);

  useEffect(() => {
    const map = getMapInstance();
    if (!map) return;
    const toolManager = getToolManager();

    // Handle map click events
    const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
      // Check if layers exist before querying
      let features: mapboxgl.MapboxGeoJSONFeature[] = [];
      if (
        map.getLayer("network-nodes-3d-layer") &&
        map.getLayer("network-connections-layer")
      ) {
        features = map.queryRenderedFeatures(event.point, {
          layers: ["network-nodes-3d-layer", "network-connections-layer"],
        });
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

        if (feature.layer && feature.layer.id === "network-nodes-3d-layer") {
          onNodeClick?.(elementId as string, event);
        } else if (feature.layer && feature.layer.id === "network-connections-layer") {
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
      const nodeLayerExists = map.getLayer("network-nodes-3d-layer");
      const connectionLayerExists = map.getLayer("network-connections-layer");

      if (!nodeLayerExists && !connectionLayerExists) return;

      const layersToQuery = [];
      if (nodeLayerExists) layersToQuery.push("network-nodes-3d-layer");
      if (connectionLayerExists) layersToQuery.push("network-connections-layer");

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
          map.getCanvas().style.cursor = "";
          return;
        }

        const source = feature.source || "network-nodes-3d";
        hoveredFeature = { id: elementId, source };

        // Set new hover state
        map.setFeatureState(
          { source: source as string, id: elementId as string | number },
          { hover: true }
        );
        map.getCanvas().style.cursor = "pointer";

        if (feature.layer?.id === "network-nodes-3d-layer") {
          setHoveredElement(elementId as string);
          onNodeHover?.(elementId as string, event);
          onConnectionHover?.(null, event);
        } else if (feature.layer?.id === "network-connections-layer") {
          setHoveredElement(elementId as string);
          onConnectionHover?.(elementId as string, event);
          onNodeHover?.(null, event);
        }
      } else {
        hoveredFeature = null;
        setHoveredElement(null);
        onNodeHover?.(null, event);
        onConnectionHover?.(null, event);
        map.getCanvas().style.cursor = "";
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
      map.getCanvas().style.cursor = "";
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
        case "v":
        case "V":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            setActiveTool("select");
            announce("Select tool activated", "polite");
          }
          break;
        case "t":
        case "T":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            setActiveTool("trace");
            announce("Trace path tool activated", "polite");
          }
          break;
        case "m":
        case "M":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            setActiveTool("measure");
            announce("Measure tool activated", "polite");
          }
          break;
        case "h":
        case "H":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            setActiveTool("heatmap");
            announce("Heatmap tool activated", "polite");
          }
          break;
        case "Escape":
          setSelectedElement(null);
          setHoveredElement(null);
          announce("Selection cleared", "polite");
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
      if (!map) return;
      
      const elapsed = Date.now() - startTime;
      
      // 1. Data Flow Animation (Dashed lines movement)
      // Note: Mapbox GL JS does not natively support 'line-dasharray-offset'.
      // For now, we omit this to prevent the runtime crash.
      // If needed, flow can be achieved via line-gradient or line-pattern.
      
      // 2. Alert Pulse Animation
      // We can animate the opacity of the glow layers
      const pulse = 0.4 + Math.sin(elapsed / 400) * 0.2; // Pulse between 0.2 and 0.6
      if (map.getLayer("network-outages-glow")) {
        map.setPaintProperty("network-outages-glow", "line-opacity", pulse);
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
    setSelectedElement,
    setHoveredElement,
    onNodeClick,
    onNodeHover,
    onConnectionClick,
    onConnectionHover,
    onMapClick,
    onMapMove,
  ]);

  // This component doesn't render anything visible
  return null;
};

// Tool-specific event handlers
export const useToolHandlers = (activeTool: string) => {
  const map = getMapInstance();

  useEffect(() => {
    if (!map) return;

    // Set cursor based on active tool
    const mapContainer = map.getContainer();

    switch (activeTool) {
      case "select":
        mapContainer.style.cursor = "pointer";
        break;
      case "trace":
        mapContainer.style.cursor = "crosshair";
        break;
      case "measure":
        mapContainer.style.cursor = "cell";
        break;
      case "heatmap":
        mapContainer.style.cursor = "help";
        break;
      default:
        mapContainer.style.cursor = "grab";
    }

    // Cleanup cursor on unmount
    return () => {
      if (mapContainer) {
        mapContainer.style.cursor = "grab";
      }
    };
  }, [activeTool, map]);

  // Tool-specific functionality can be implemented here
  return {
    // Tool-specific methods will be added in later tasks
  };
};

// Utility function to get features at a point
export const getFeaturesAtPoint = (point: mapboxgl.Point, layerIds?: string[]) => {
  const map = getMapInstance();
  if (!map) return [];

  // Check if layers exist before querying
  const layersToQuery = layerIds || [
    "network-nodes-3d-layer",
    "network-connections-layer",
  ];
  const layersExist = layersToQuery.every((layerId) => map.getLayer(layerId));

  if (!layersExist) {
    return [];
  }

  return map.queryRenderedFeatures(point, {
    layers: layersToQuery,
  });
};

// Utility function to fit bounds
export const fitMapBounds = (bounds: mapboxgl.LngLatBoundsLike, padding?: number) => {
  const map = getMapInstance();
  if (!map) return;

  map.fitBounds(bounds, {
    padding: padding || 50,
    duration: 1000,
    essential: true,
  });
};

// Utility function to fly to a location
export const flyToLocation = (
  center: mapboxgl.LngLatLike,
  zoom?: number,
  bearing?: number,
  pitch?: number
) => {
  const map = getMapInstance();
  if (!map) return;

  map.flyTo({
    center,
    zoom: zoom || map.getZoom(),
    bearing: bearing || map.getBearing(),
    pitch: pitch || map.getPitch(),
    duration: 1500,
    essential: true,
  });
};

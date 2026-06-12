"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapInstance } from "../hooks/useMapInstance";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { useAccessibilityAnnounce } from "./AccessibilityAnnouncer";
import { getToolManager } from "../tools/toolManager";
import { safeHasLayer } from "../utils/mapUtils";
import {
  getNetworkQueryableLayers,
  isConnectionLayerId,
  isNodeLayerId,
} from "../utils/mapStyling/queryLayers";
import { isOutagesLayerVisible } from "../utils/layerVisibility";
import { NetworkStatus } from "../types";
import { createLogger } from "@/lib/logger";

const log = createLogger("MapEventHandler");

interface MapEventHandlerProps {
  onNodeClick?: (nodeId: string, event: mapboxgl.MapMouseEvent) => void;
  onNodeHover?: (nodeId: string | null, event: mapboxgl.MapMouseEvent) => void;
  onConnectionClick?: (connectionId: string, event: mapboxgl.MapMouseEvent) => void;
  onConnectionHover?: (connectionId: string | null, event: mapboxgl.MapMouseEvent) => void;
  onMapClick?: (event: mapboxgl.MapMouseEvent) => void;
  onMapMove?: (event: mapboxgl.MapboxEvent) => void;
}

function mapNeedsPulseAnimation(map: mapboxgl.Map): boolean {
  if (!map.isStyleLoaded()) return false;

  if (
    safeHasLayer(map, "network-outages-glow") &&
    isOutagesLayerVisible(useNetworkMapStore.getState().layers)
  ) {
    return true;
  }

  if (!safeHasLayer(map, "network-nodes-glow") || map.getZoom() < 9) {
    return false;
  }

  const { nodes } = useNetworkMapStore.getState();
  return nodes.some(
    (n) => n.status === NetworkStatus.ERROR || n.status === NetworkStatus.WARNING
  );
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

  const map = useMapInstance();

  const activeToolRef = useRef(activeTool);
  const announceRef = useRef(announce);
  const callbacksRef = useRef({
    onNodeClick,
    onNodeHover,
    onConnectionClick,
    onConnectionHover,
    onMapClick,
    onMapMove,
  });

  useEffect(() => {
    activeToolRef.current = activeTool;
    announceRef.current = announce;
    callbacksRef.current = {
      onNodeClick,
      onNodeHover,
      onConnectionClick,
      onConnectionHover,
      onMapClick,
      onMapMove,
    };
  }, [
    activeTool,
    announce,
    onNodeClick,
    onNodeHover,
    onConnectionClick,
    onConnectionHover,
    onMapClick,
    onMapMove,
  ]);

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

    const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
      let features: mapboxgl.MapboxGeoJSONFeature[] = [];
      const queryLayers = getNetworkQueryableLayers(map, safeHasLayer);
      if (queryLayers.length > 0) {
        features = map.queryRenderedFeatures(event.point, { layers: queryLayers });
      }

      toolManager.handleEvent("onClick", {
        lngLat: event.lngLat,
        point: event.point,
        originalEvent: event.originalEvent,
        features,
      });

      const {
        onNodeClick: onNode,
        onConnectionClick: onConn,
        onMapClick: onEmpty,
      } = callbacksRef.current;

      if (features.length > 0) {
        const feature = features[0];
        const elementId = feature.properties?.id as string | undefined;
        if (!elementId) return;

        if (isNodeLayerId(feature.layer?.id)) {
          onNode?.(elementId, event);
        } else if (isConnectionLayerId(feature.layer?.id)) {
          onConn?.(elementId, event);
        }
      } else {
        onEmpty?.(event);
      }
    };

    let hoveredFeature: { id: string; source: string } | null = null;
    let hoveredElementId: string | null = null;
    let hoveredKind: "node" | "connection" | null = null;

    const clearHoverState = (event: mapboxgl.MapMouseEvent) => {
      if (hoveredFeature) {
        map.setFeatureState(
          { source: hoveredFeature.source, id: hoveredFeature.id },
          { hover: false }
        );
        hoveredFeature = null;
      }

      const { onNodeHover: onNode, onConnectionHover: onConn } = callbacksRef.current;
      const hadHover = hoveredElementId !== null || hoveredKind !== null;

      hoveredElementId = null;
      hoveredKind = null;

      if (!hadHover) {
        map.getCanvas().style.cursor = resolveCursor(false);
        return;
      }

      setHoveredElement(null);
      onNode?.(null, event);
      onConn?.(null, event);
      map.getCanvas().style.cursor = resolveCursor(false);
    };

    const handleMouseMove = (event: mapboxgl.MapMouseEvent) => {
      const layersToQuery = getNetworkQueryableLayers(map, safeHasLayer);
      if (layersToQuery.length === 0) return;

      const features = map.queryRenderedFeatures(event.point, {
        layers: layersToQuery,
      });

      const { onNodeHover: onNode, onConnectionHover: onConn } = callbacksRef.current;

      if (features.length > 0) {
        const feature = features[0];
        const elementId = feature.properties?.id as string | undefined;

        if (!elementId) {
          clearHoverState(event);
          return;
        }

        const source = (feature.source as string) || "network-nodes";
        const isNode = isNodeLayerId(feature.layer?.id);
        const isConnection = isConnectionLayerId(feature.layer?.id);
        const nextKind = isNode ? "node" : isConnection ? "connection" : null;

        if (
          hoveredFeature?.id !== elementId ||
          hoveredFeature?.source !== source
        ) {
          if (hoveredFeature) {
            map.setFeatureState(
              { source: hoveredFeature.source, id: hoveredFeature.id },
              { hover: false }
            );
          }
          hoveredFeature = { id: elementId, source };
          map.setFeatureState({ source, id: elementId }, { hover: true });
        }

        map.getCanvas().style.cursor = resolveCursor(true);

        if (isNode) {
          if (hoveredElementId !== elementId || hoveredKind !== "node") {
            hoveredElementId = elementId;
            hoveredKind = "node";
            setHoveredElement(elementId);
            onNode?.(elementId, event);
            onConn?.(null, event);
          } else {
            onNode?.(elementId, event);
          }
        } else if (isConnection) {
          if (hoveredElementId !== elementId || hoveredKind !== "connection") {
            hoveredElementId = elementId;
            hoveredKind = "connection";
            setHoveredElement(elementId);
            onConn?.(elementId, event);
            onNode?.(null, event);
          } else {
            onConn?.(elementId, event);
          }
        }
      } else {
        clearHoverState(event);
      }
    };

    const handleMouseLeave = () => {
      const noopEvent = {
        point: { x: 0, y: 0 },
        lngLat: { lng: 0, lat: 0 },
      } as mapboxgl.MapMouseEvent;
      clearHoverState(noopEvent);
    };

    const handleMapMoveEvent = (event: mapboxgl.MapboxEvent) => {
      callbacksRef.current.onMapMove?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const baseMoveStep = 50;
      const zoomStep = 0.5;
      const moveStep = baseMoveStep * (event.shiftKey ? 3 : 1);

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
        case "=": {
          event.preventDefault();
          const nextZoom = map.getZoom() + zoomStep;
          map.easeTo({ zoom: nextZoom, duration: 200 });
          announceRef.current(`Zoomed in to level ${nextZoom.toFixed(1)}`, "polite");
          break;
        }
        case "-":
        case "_": {
          event.preventDefault();
          const prevZoom = map.getZoom() - zoomStep;
          map.easeTo({ zoom: prevZoom, duration: 200 });
          announceRef.current(`Zoomed out to level ${prevZoom.toFixed(1)}`, "polite");
          break;
        }
        case "0":
          event.preventDefault();
          map.resetNorth({ duration: 500 });
          announceRef.current("Map orientation reset to north", "polite");
          break;
        case "Escape":
          toolManager.handleEvent("onKeyDown", event);
          if (activeToolRef.current === "select") {
            setSelectedElement(null);
            setHoveredElement(null);
            announceRef.current("Selection cleared", "polite");
          }
          break;
        default:
          toolManager.handleEvent("onKeyDown", event);
          break;
      }
    };

    map.on("click", handleMapClick);
    map.on("mousemove", handleMouseMove);
    map.on("mouseleave", handleMouseLeave);
    map.on("move", handleMapMoveEvent);

    const mapContainer = map.getContainer();
    mapContainer.addEventListener("keydown", handleKeyDown);
    mapContainer.tabIndex = 0;

    // Pulse animation — runs only while outages or warning/error nodes need it
    let animationFrame: number | undefined;
    const startTime = Date.now();
    let animating = false;

    const stopAnimation = () => {
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }
      animating = false;
    };

    const scheduleAnimation = () => {
      if (animating) return;
      if (!mapNeedsPulseAnimation(map)) return;
      animating = true;
      animationFrame = requestAnimationFrame(animateMap);
    };

    const animateMap = () => {
      if (!map.getContainer()) {
        stopAnimation();
        return;
      }

      if (!map.isStyleLoaded()) {
        animationFrame = requestAnimationFrame(animateMap);
        return;
      }

      if (!mapNeedsPulseAnimation(map)) {
        stopAnimation();
        return;
      }

      const elapsed = Date.now() - startTime;

      try {
        const outageLayerId = "network-outages-glow";
        if (safeHasLayer(map, outageLayerId)) {
          const pulse = 0.4 + Math.sin(elapsed / 400) * 0.2;
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
        log.debug("Animation frame skipped:", error);
      }

      animationFrame = requestAnimationFrame(animateMap);
    };

    const onDataOrZoom = () => scheduleAnimation();
    map.on("sourcedata", onDataOrZoom);
    map.on("zoomend", onDataOrZoom);

    const unsubStore = useNetworkMapStore.subscribe((state, prev) => {
      if (
        state.layers !== prev.layers ||
        state.nodes !== prev.nodes ||
        state.simulatedOutageActive !== prev.simulatedOutageActive
      ) {
        scheduleAnimation();
      }
    });

    scheduleAnimation();

    return () => {
      stopAnimation();
      unsubStore();
      map.off("click", handleMapClick);
      map.off("mousemove", handleMouseMove);
      map.off("mouseleave", handleMouseLeave);
      map.off("move", handleMapMoveEvent);
      map.off("sourcedata", onDataOrZoom);
      map.off("zoomend", onDataOrZoom);
      mapContainer.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, setSelectedElement, setHoveredElement]);

  return null;
};

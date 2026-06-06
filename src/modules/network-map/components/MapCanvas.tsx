"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, Button, Icon } from "@shohojdhara/atomix";
import {
  useNetworkMapStore,
  useViewport,
  useNodes,
  useConnections,
} from "../stores/useNetworkMapStore";
import { MAPBOX_CONFIG } from "../constants";
import { createLogger } from "@/lib/logger";

const log = createLogger("MapCanvas");
import { EnhancedLoadingState } from "./EnhancedLoadingState";
import {
  addCustomLayers,
  updateLayerVisibility,
  createNodeFeature,
  createConnectionFeature,
  create3DNodeFeatures,
  ZOOM_NODES_3D_MIN,
  ZOOM_SHOW_CUSTOMER_CONNECTIONS,
} from "../utils/mapStyling";
import {
  visibleConnectionTypesFromLayers,
  visibleNodeTypesFromLayers,
  isCoverageLayerVisible,
  isOutagesLayerVisible,
} from "../utils/layerVisibility";
import { ConnectionType, NetworkNodeType, NetworkStatus } from "../types";
import type { NetworkMapLayer } from "../types";
import type { NetworkNode, NetworkConnection } from "../types";

let globalMapInstance: mapboxgl.Map | null = null;

interface MapCanvasProps {
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapError?: (error: Error) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onMapLoad, onMapError }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tokenError = !MAPBOX_CONFIG.ACCESS_TOKEN
    ? "Mapbox access token not configured."
    : null;

  const [mapLoading, setMapLoading] = useState(!tokenError);
  const [mapError, setMapError] = useState<string | null>(tokenError);
  const [isReady, setIsReady] = useState(false);

  const viewport = useViewport();
  const nodes = useNodes();
  const connections = useConnections();
  const layers = useNetworkMapStore((state) => state.layers);
  const setViewport = useNetworkMapStore((state) => state.setViewport);
  const setDragging = useNetworkMapStore((state) => state.setDragging);
  const setZooming = useNetworkMapStore((state) => state.setZooming);

  useEffect(() => {
    if (tokenError) onMapError?.(new Error(tokenError));
  }, [tokenError, onMapError]);

  const createCircleCoordinates = useCallback(
    (lng: number, lat: number, radius: number, points = 32) => {
      const coords = [];
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        coords.push([lng + radius * Math.cos(angle), lat + radius * Math.sin(angle)]);
      }
      coords.push(coords[0]);
      return coords;
    },
    []
  );

  const initializeLayers = useCallback((map: mapboxgl.Map) => {
    try {
      addCustomLayers(map);
    } catch (error) {
      log.error("Layer init failed:", error);
      throw error;
    }
  }, []);

  const updateMapData = useCallback(
    (
      map: mapboxgl.Map,
      allNodes: NetworkNode[],
      allConnections: NetworkConnection[],
      layerState: NetworkMapLayer[]
    ) => {
      try {
        if (!map.isStyleLoaded()) return;

        if (!map.getSource("network-nodes")) {
          initializeLayers(map);
        }

        const nodeTypes = visibleNodeTypesFromLayers(layerState);
        const connTypes = visibleConnectionTypesFromLayers(layerState);
        const nodeTypeSet = new Set(nodeTypes.map(String));

        const filteredNodes =
          nodeTypes.length === 0
            ? []
            : allNodes.filter((n) => nodeTypeSet.has(String(n.type)));

        const currentZoom = map.getZoom();

        const connTypeSet = new Set(connTypes.map(String));
        let filteredConnections =
          connTypes.length === 0
            ? []
            : allConnections.filter((c) => connTypeSet.has(String(c.type)));

        // Overview: trunk only — last-mile starbursts wash out the map
        if (currentZoom < ZOOM_SHOW_CUSTOMER_CONNECTIONS) {
          filteredConnections = filteredConnections.filter(
            (c) => c.type === ConnectionType.FIBER_ROUTE
          );
        }

        const nodeFeatures = filteredNodes.map(createNodeFeature);
        const nodesSource = map.getSource("network-nodes") as
          | mapboxgl.GeoJSONSource
          | undefined;
        if (nodesSource)
          nodesSource.setData({ type: "FeatureCollection", features: nodeFeatures });

        const render3D = currentZoom >= ZOOM_NODES_3D_MIN - 0.5;

        const node3DFeatures = render3D ? filteredNodes.flatMap(create3DNodeFeatures) : [];
        const nodes3DSource = map.getSource("network-nodes-3d") as
          | mapboxgl.GeoJSONSource
          | undefined;
        if (nodes3DSource)
          nodes3DSource.setData({ type: "FeatureCollection", features: node3DFeatures });

        const allNodesMap = new Map(allNodes.map((n) => [n.id, n]));

        const connectionFeatures = filteredConnections
          .map((conn) => createConnectionFeature(conn, allNodesMap))
          .filter((f): f is GeoJSON.Feature => f != null);
        const connectionsSource = map.getSource("network-connections") as
          | mapboxgl.GeoJSONSource
          | undefined;
        if (connectionsSource)
          connectionsSource.setData({
            type: "FeatureCollection",
            features: connectionFeatures,
          });

        const outageConnections = isOutagesLayerVisible(layerState)
          ? allConnections.filter((c) => c.status === NetworkStatus.ERROR)
          : [];
        const outageFeatures = outageConnections
          .map((conn) => createConnectionFeature(conn, allNodesMap))
          .filter((f): f is GeoJSON.Feature => f != null);
        const outagesSource = map.getSource("network-outages") as
          | mapboxgl.GeoJSONSource
          | undefined;
        if (outagesSource)
          outagesSource.setData({ type: "FeatureCollection", features: outageFeatures });

        const coverageNodes =
          isCoverageLayerVisible(layerState) && nodeTypes.length > 0
            ? filteredNodes.filter(
                (n) =>
                  n.type === NetworkNodeType.CORE_NODE ||
                  n.type === NetworkNodeType.DISTRIBUTION_NODE ||
                  n.type === NetworkNodeType.POP
              )
            : [];
        const coverageFeatures = coverageNodes.map((node) => ({
          type: "Feature" as const,
          geometry: {
            type: "Polygon" as const,
            coordinates: [
              createCircleCoordinates(node.position.lng, node.position.lat, 0.015),
            ],
          },
          properties: { id: `coverage-${node.id}`, name: `${node.name} Coverage` },
        }));
        const coverageSource = map.getSource("network-coverage") as
          | mapboxgl.GeoJSONSource
          | undefined;
        if (coverageSource)
          coverageSource.setData({
            type: "FeatureCollection",
            features: coverageFeatures,
          });

        // Avoid stale Mapbox filters (previously hid all features in GL JS 3)
        const clearFilterIds = [
          "network-nodes-3d-layer",
          "network-connections-layer",
          "network-connections-casing",
          "network-connections-glow",
        ];
        clearFilterIds.forEach((id) => {
          if (map.getLayer(id)) map.setFilter(id, null);
        });

        const nodesVisible = nodeTypes.length > 0;
        updateLayerVisibility(map, "network-nodes-layer", nodesVisible);
        updateLayerVisibility(map, "network-nodes-3d-layer", nodesVisible);

        const connectionsVisible = connTypes.length > 0;
        updateLayerVisibility(map, "network-connections-layer", connectionsVisible);

        if (map.getLayer("network-outages-layer")) {
          updateLayerVisibility(
            map,
            "network-outages-layer",
            isOutagesLayerVisible(layerState)
          );
        }
        if (map.getLayer("network-coverage-layer")) {
          updateLayerVisibility(
            map,
            "network-coverage-layer",
            isCoverageLayerVisible(layerState)
          );
        }
      } catch (error) {
        log.error("Update failed:", error);
      }
    },
    [initializeLayers, createCircleCoordinates]
  );

  // Map instance is created once on mount; re-running when viewport/store callbacks
  // change would tear down and recreate the map on every pan/zoom.
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || tokenError) return;
    mapboxgl.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN as string;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_CONFIG.STYLE,
        center: [viewport.center.lng, viewport.center.lat],
        zoom: viewport.zoom,
        bearing: viewport.bearing,
        pitch: viewport.pitch,
        minZoom: MAPBOX_CONFIG.MIN_ZOOM,
        maxZoom: MAPBOX_CONFIG.MAX_ZOOM,
        attributionControl: false,
        preserveDrawingBuffer: true,
      });

      mapRef.current = map;
      globalMapInstance = map;

      let hasInitialLoadCompleted = false;
      let styleRestoreGeneration = 0;
      let pendingStyleIdleHandler: (() => void) | null = null;

      const cancelPendingStyleRestore = () => {
        if (pendingStyleIdleHandler) {
          map.off("idle", pendingStyleIdleHandler);
          pendingStyleIdleHandler = null;
        }
      };

      const restoreNetworkDataAfterStyleChange = () => {
        if (!mapRef.current) return;

        const currentState = useNetworkMapStore.getState();
        updateMapData(
          map,
          currentState.nodes,
          currentState.connections,
          currentState.layers
        );
        requestAnimationFrame(() => mapRef.current?.resize());
        log.info("Network layers restored after style change");
      };

      map.on("load", () => {
        initializeLayers(map);
        setMapLoading(false);
        setIsReady(true);
        hasInitialLoadCompleted = true;
        useNetworkMapStore.getState().setMapInstance(map);
        const center = map.getCenter();
        setViewport({
          center: { lat: center.lat, lng: center.lng },
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        });
        requestAnimationFrame(() => map.resize());
        onMapLoad?.(map);
      });

      // Re-initialize layers when basemap changes (satellite toggle, etc.).
      // Skip the first style.load — the initial "load" handler owns first paint.
      map.on("style.load", () => {
        if (!hasInitialLoadCompleted) return;

        cancelPendingStyleRestore();
        const generation = ++styleRestoreGeneration;

        log.info("Style changed, re-initializing layers...");

        try {
          initializeLayers(map);
        } catch (error) {
          log.error("Failed to restore layers after style change:", error);
          return;
        }

        // idle = style sprites/sources/tiles settled (isStyleLoaded polling is unreliable here)
        const onIdle = () => {
          if (generation !== styleRestoreGeneration || !mapRef.current) return;
          cancelPendingStyleRestore();
          restoreNetworkDataAfterStyleChange();
        };

        pendingStyleIdleHandler = onIdle;
        map.once("idle", onIdle);
      });

      map.on("error", (e) => {
        const error = `Map error: ${e.error?.message || "Unknown error"}`;
        setMapError(error);
        onMapError?.(new Error(error));
      });

      const syncViewportFromMap = () => {
        if (!mapRef.current) return;
        const center = map.getCenter();
        setViewport({
          center: { lat: center.lat, lng: center.lng },
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        });
      };

      // Commit viewport on gesture end — avoids store churn every animation frame
      map.on("moveend", syncViewportFromMap);
      map.on("rotateend", syncViewportFromMap);
      map.on("pitchend", syncViewportFromMap);

      map.on("dragstart", () => setDragging(true));
      map.on("dragend", () => setDragging(false));
      map.on("zoomstart", () => setZooming(true));
      map.on("zoomend", () => setZooming(false));

      return () => {
        cancelPendingStyleRestore();
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          globalMapInstance = null;
          useNetworkMapStore.getState().setMapInstance(null);
          setIsReady(false);
        }
      };
    } catch (error) {
      setTimeout(() => {
        setMapError(error instanceof Error ? error.message : "Failed to init map");
        setMapLoading(false);
      }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only init
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapRef.current || !isReady) return;
    const map = mapRef.current;
    const el = mapContainer.current;
    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isReady]);

  const isZoomedInFor3D = viewport.zoom >= ZOOM_NODES_3D_MIN - 0.5;
  const isOverviewZoom = viewport.zoom < ZOOM_SHOW_CUSTOMER_CONNECTIONS;

  useEffect(() => {
    if (!mapRef.current || !isReady) return;
    const map = mapRef.current;

    const apply = () => {
      if (!map.isStyleLoaded()) {
        map.once("styledata", apply);
        return;
      }
      updateMapData(map, nodes, connections, layers);
      requestAnimationFrame(() => map.resize());
    };

    apply();
  }, [nodes, connections, isReady, layers, updateMapData, isZoomedInFor3D, isOverviewZoom]);

  if (mapError) {
    return (
      <div className="u-absolute u-inset-0 u-flex u-items-center u-justify-center u-bg-dark u-p-6">
        <Card
          className="u-max-w-md u-w-100 u-p-8 u-text-center u-bg-white-opacity-5"
        >
          <div className="u-inline-flex u-items-center u-justify-center u-w-16 u-h-16 u-rounded-circle u-bg-error-subtle u-border u-border-solid u-border-error u-mb-6">
            <Icon name="Warning" size={32} className="u-text-error" />
          </div>
          <h3 className="u-m-0 u-text-xl u-font-bold  u-text-uppercase u-mb-2">
            Map Engine Error
          </h3>
          <p className="u-text-sm u-text-secondary-emphasis u-mb-8">{mapError}</p>
          <Button
            variant="primary"
            iconName="RefreshCw"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="u-relative u-w-100 u-h-100 map-canvas-container">
      <div
        ref={mapContainer}
        className="u-w-100 u-h-100 u-bg-dark u-transition-all"
        role="application"
        aria-label="Network Map"
        tabIndex={0}
      />
      {mapLoading && (
        <EnhancedLoadingState message="Initializing Neural Map..." variant="overlay" />
      )}
    </div>
  );
};

export const getMapInstance = (): mapboxgl.Map | null => globalMapInstance;

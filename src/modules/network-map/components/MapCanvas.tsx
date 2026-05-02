"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { LoadingState } from "./LoadingState";
import {
  addCustomLayers,
  createNodeFeature,
  createConnectionFeature,
} from "../utils/mapStyling";
import { NetworkNodeType, NetworkStatus } from "../types";
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

  const createCircleCoordinates = (
    lng: number,
    lat: number,
    radius: number,
    points = 32
  ) => {
    const coords = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      coords.push([lng + radius * Math.cos(angle), lat + radius * Math.sin(angle)]);
    }
    coords.push(coords[0]);
    return coords;
  };

  const initializeLayers = (map: mapboxgl.Map) => {
    try {
      addCustomLayers(map);
    } catch (error) {
      console.error("[MapCanvas] Layer init failed:", error);
      throw error;
    }
  };

  const updateMapData = (
    map: mapboxgl.Map,
    nodes: NetworkNode[],
    connections: NetworkConnection[]
  ) => {
    try {
      const nodeFeatures = nodes.map(createNodeFeature);
      const nodesSource = map.getSource("network-nodes") as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (nodesSource)
        nodesSource.setData({ type: "FeatureCollection", features: nodeFeatures });

      const connectionFeatures = connections.map((conn) =>
        createConnectionFeature(conn, nodes)
      );
      const connectionsSource = map.getSource("network-connections") as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (connectionsSource)
        connectionsSource.setData({
          type: "FeatureCollection",
          features: connectionFeatures,
        });

      const outageFeatures = connections
        .filter((c) => c.status === NetworkStatus.ERROR)
        .map((conn) => createConnectionFeature(conn, nodes));
      const outagesSource = map.getSource("network-outages") as
        | mapboxgl.GeoJSONSource
        | undefined;
      if (outagesSource)
        outagesSource.setData({ type: "FeatureCollection", features: outageFeatures });

      const coverageNodes = nodes.filter(
        (n) =>
          n.type === NetworkNodeType.CORE_NODE ||
          n.type === NetworkNodeType.DISTRIBUTION_NODE
      );
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
        coverageSource.setData({ type: "FeatureCollection", features: coverageFeatures });
    } catch (error) {
      console.error("[MapCanvas] Update failed:", error);
    }
  };

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

      map.on("load", () => {
        setMapLoading(false);
        onMapLoad?.(map);
        initializeLayers(map);
        updateMapData(map, nodes, connections);
      });

      map.on("error", (e) => {
        const error = `Map error: ${e.error?.message || "Unknown error"}`;
        setMapError(error);
        onMapError?.(new Error(error));
      });

      map.on("move", () => {
        if (!mapRef.current) return;
        const center = map.getCenter();
        setViewport({
          center: { lat: center.lat, lng: center.lng },
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        });
      });

      map.on("dragstart", () => setDragging(true));
      map.on("dragend", () => setDragging(false));
      map.on("zoomstart", () => setZooming(true));
      map.on("zoomend", () => setZooming(false));

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          globalMapInstance = null;
        }
      };
    } catch (error) {
      setMapError(error instanceof Error ? error.message : "Failed to init map");
      setMapLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    updateMapData(mapRef.current, nodes, connections);
  }, [nodes, connections]);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const map = mapRef.current;
    layers.forEach((layer) => {
      const ids =
        layer.id === "fiber-routes"
          ? ["network-connections-layer"]
          : layer.id === "outages"
            ? ["network-outages-layer"]
            : layer.id === "coverage"
              ? ["network-coverage-layer"]
              : [];
      ids.forEach(
        (id) =>
          map.getLayer(id) &&
          map.setLayoutProperty(id, "visibility", layer.visible ? "visible" : "none")
      );
    });
  }, [layers]);

  if (mapError) {
    return (
      <div className="u-absolute u-inset-0 u-flex u-items-center u-justify-center u-bg-dark u-p-6">
        <Card
          glass={true}
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
    <div className="u-relative u-w-100 u-h-100">
      <div
        ref={mapContainer}
        className="u-w-100 u-h-100 u-bg-dark u-transition-all"
        role="application"
        aria-label="Network Map"
        tabIndex={0}
      />
      {mapLoading && (
        <LoadingState message="Initializing Neural Map..." variant="overlay" />
      )}

      <style jsx>{`
        div:focus-within {
          outline: 2px solid var(--color-primary);
          outline-offset: -2px;
        }
      `}</style>
    </div>
  );
};

export const getMapInstance = (): mapboxgl.Map | null => globalMapInstance;

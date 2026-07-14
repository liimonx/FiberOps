"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { Button, Icon } from "@shohojdhara/atomix";
import { MAPBOX_CONFIG } from "@/modules/network-map/constants";
import { useMapboxAccessToken } from "@/modules/network-map/hooks/useMapboxAccessToken";
import { incidentSeverityColors } from "@/lib/themeColors";
import type { Asset, Incident } from "@/types/domain";

type IncidentMapPreviewProps = {
  incidents: Incident[];
  assets: Asset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

type IncidentMarker = {
  incidentId: string;
  lng: number;
  lat: number;
  severity: Incident["severity"];
};

const severityColors = incidentSeverityColors;

export function IncidentMapPreview({
  incidents,
  assets,
  selectedId,
  onSelect,
}: IncidentMapPreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const hasFitBoundsRef = useRef(false);
  const { accessToken, isLoading: isTokenLoading } = useMapboxAccessToken();
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (isTokenLoading) return;
    if (!accessToken) {
      setMapError(
        "Mapbox access token not configured. Add it under Settings → Integrations or set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN."
      );
    } else {
      setMapError(null);
    }
  }, [accessToken, isTokenLoading]);

  const markers = useMemo(() => {
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));

    return incidents
      .filter((incident) => incident.status !== "resolved")
      .map((incident): IncidentMarker | null => {
        if (!incident.relatedAssetId) return null;
        const asset = assetById.get(incident.relatedAssetId);
        if (!asset) return null;

        return {
          incidentId: incident.id,
          lng: asset.location.lng,
          lat: asset.location.lat,
          severity: incident.severity,
        };
      })
      .filter((marker): marker is IncidentMarker => marker !== null);
  }, [incidents, assets]);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container || mapRef.current || mapError || !accessToken) return;

    let map: mapboxgl.Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let cancelled = false;

    const mountMap = () => {
      if (cancelled || mapRef.current) return;

      const { width, height } = container.getBoundingClientRect();
      if (width < 1 || height < 1) return;

      mapboxgl.accessToken = accessToken;

      map = new mapboxgl.Map({
        container,
        style: MAPBOX_CONFIG.STYLE,
        center: MAPBOX_CONFIG.DEFAULT_CENTER,
        zoom: 13,
        pitch: 0,
        bearing: 0,
        interactive: true,
        attributionControl: true,
      });

      mapRef.current = map;

      map.on("error", () => {
        setMapError("Failed to load map preview.");
      });

      map.once("load", () => {
        requestAnimationFrame(() => map?.resize());
      });
    };

    const handleContainerResize = () => {
      if (mapRef.current) {
        mapRef.current.resize();
        return;
      }
      mountMap();
    };

    resizeObserver = new ResizeObserver(handleContainerResize);
    resizeObserver.observe(container);
    mountMap();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [mapError, accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapError) return;

    const renderMarkers = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (markers.length > 0 && !hasFitBoundsRef.current) {
        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach((markerData) => bounds.extend([markerData.lng, markerData.lat]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
        hasFitBoundsRef.current = true;
      }

      markers.forEach((markerData) => {
        const isSelected = markerData.incidentId === selectedId;
        const element = document.createElement("button");
        element.type = "button";
        element.className = `u-map-marker${isSelected ? " u-map-marker--selected" : ""}`;
        element.setAttribute("aria-label", `Select incident ${markerData.incidentId}`);
        element.style.width = isSelected ? "28px" : "22px";
        element.style.height = isSelected ? "28px" : "22px";
        element.style.borderRadius = "50%";
        element.style.border = isSelected
          ? "3px solid var(--atomix-white, #ffffff)"
          : "2px solid rgba(255,255,255,0.8)";
        element.style.background = severityColors[markerData.severity];
        element.style.boxShadow = isSelected
          ? "0 0 0 4px rgba(var(--atomix-error-rgb, 220, 53, 69), 0.35)"
          : "0 0 0 2px rgba(0, 0, 0, 0.2)";

        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelect(markerData.incidentId);
        });

        const marker = new mapboxgl.Marker({ element })
          .setLngLat([markerData.lng, markerData.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (map.isStyleLoaded()) {
      renderMarkers();
    } else {
      map.once("load", renderMarkers);
    }
  }, [markers, selectedId, onSelect, mapError]);

  if (mapError) {
    return (
      <div className="u-map-preview-shell u-flex u-flex-column u-p-4">
        <p className="u-text-sm u-text-secondary-emphasis u-mb-3">{mapError}</p>
        <ul className="u-text-sm u-mb-4 u-flex-grow-1">
          {markers.map((marker) => (
            <li key={marker.incidentId} className="u-mb-2">
              <button
                type="button"
                className="u-font-mono u-text-sm"
                onClick={() => onSelect(marker.incidentId)}
              >
                {marker.incidentId}
              </button>
              <span className="u-text-secondary-emphasis">
                {" "}
                — {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/network-map">
          <Button variant="outline-secondary" size="sm">
            View on Map
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="u-map-preview-shell">
      <div
        ref={mapContainer}
        className="u-map-preview-canvas"
        style={{ position: "absolute", inset: 0 }}
        role="application"
      />
      <div className="u-map-preview-badge">
        <Icon name="Warning" size="sm" className="u-text-error" />
        <span>
          {markers.length} active {markers.length === 1 ? "pinpoint" : "pinpoints"}
        </span>
      </div>
    </div>
  );
}

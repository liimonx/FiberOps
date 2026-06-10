"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { Button, Icon } from "@shohojdhara/atomix";
import { MAPBOX_CONFIG } from "@/modules/network-map/constants";
import type { Customer } from "@/types/domain";

type CustomerMapPreviewProps = {
  customers: Customer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

type CustomerMarker = {
  customerId: string;
  lng: number;
  lat: number;
  status: Customer["status"];
};

const statusColors: Record<Customer["status"], string> = {
  online: "#22c55e",
  unstable: "#f59e0b",
  offline: "#ef4444",
};

export function CustomerMapPreview({
  customers,
  selectedId,
  onSelect,
}: CustomerMapPreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(
    MAPBOX_CONFIG.ACCESS_TOKEN ? null : "Mapbox access token not configured."
  );

  const markers = useMemo(
    () =>
      customers
        .filter((customer) => customer.location)
        .map(
          (customer): CustomerMarker => ({
            customerId: customer.id,
            lng: customer.location!.lng,
            lat: customer.location!.lat,
            status: customer.status,
          })
        ),
    [customers]
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || mapError) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.STYLE,
      center: MAPBOX_CONFIG.DEFAULT_CENTER,
      zoom: 13,
      pitch: 0,
      bearing: 0,
      interactive: true,
    });

    mapRef.current = map;

    map.on("error", () => {
      setMapError("Failed to load map preview.");
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [mapError]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapError) return;

    const renderMarkers = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      markers.forEach((markerData) => {
        const isSelected = markerData.customerId === selectedId;
        const element = document.createElement("button");
        element.type = "button";
        element.className = `u-customers-map-marker${isSelected ? " u-customers-map-marker--selected" : ""}`;
        element.setAttribute("aria-label", `Select customer ${markerData.customerId}`);
        element.style.width = isSelected ? "28px" : "22px";
        element.style.height = isSelected ? "28px" : "22px";
        element.style.borderRadius = "50%";
        element.style.border = isSelected
          ? "3px solid #ffffff"
          : "2px solid rgba(255,255,255,0.8)";
        element.style.background = statusColors[markerData.status];
        element.style.boxShadow = isSelected
          ? "0 0 0 4px rgba(34, 197, 94, 0.35)"
          : "0 0 0 2px rgba(0, 0, 0, 0.2)";

        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelect(markerData.customerId);
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
      <div className="u-customers-map-shell u-flex u-flex-column u-p-4">
        <p className="u-text-sm u-text-secondary-emphasis u-mb-3">{mapError}</p>
        <ul className="u-text-sm u-mb-4 u-flex-grow-1">
          {markers.map((marker) => (
            <li key={marker.customerId} className="u-mb-2">
              <button
                type="button"
                className="u-font-mono u-text-sm"
                onClick={() => onSelect(marker.customerId)}
              >
                {marker.customerId}
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
    <div className="u-customers-map-shell">
      <div ref={mapContainer} className="u-w-100 u-h-100" role="application" />
      <div className="u-customers-map-badge">
        <Icon name="Users" size="sm" className="u-text-primary" />
        <span>
          {markers.length} {markers.length === 1 ? "customer" : "customers"} on map
        </span>
      </div>
    </div>
  );
}

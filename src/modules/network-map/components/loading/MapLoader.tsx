"use client";

import { Card } from "@shohojdhara/atomix";
import { LoadingIndicator } from "./LoadingIndicator";

export interface MapLoaderProps {
  message?: string;
  subMessage?: string;
}

export function MapLoader({
  message = "Initializing Neural Map",
  subMessage = "Syncing tiles and vector layers",
}: MapLoaderProps) {
  const statusLabel = `${message}. ${subMessage}`;

  return (
    <div
      className="map-loader-overlay"
      aria-busy="true"
      aria-label={statusLabel}
    >
      <div className="map-loader-overlay__backdrop" aria-hidden />

      <Card glass className="map-loader">
        <LoadingIndicator
          message={message}
          subMessage={subMessage}
          size="md"
          layout="horizontal"
          aria-label={statusLabel}
        />
      </Card>
    </div>
  );
}

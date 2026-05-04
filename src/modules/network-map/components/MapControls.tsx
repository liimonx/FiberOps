"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Button, Card, Icon } from "@shohojdhara/atomix";
import { getMapInstance } from "./MapCanvas";
import { useResponsive } from "../hooks/useResponsive";
import { useAccessibilityAnnounce } from "./AccessibilityAnnouncer";

interface MapControlsProps {
  className?: string;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  showCompass?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  className = "",
  position = "top-right",
  showCompass = true,
}) => {
  const { isMobile } = useResponsive();
  const { announce } = useAccessibilityAnnounce();
  const [isSatelliteView, setIsSatelliteView] = useState(false);

  const handleZoomIn = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      map.zoomIn();
      announce("Map zoomed in", "polite");
    }
  }, [announce]);

  const handleZoomOut = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      map.zoomOut();
      announce("Map zoomed out", "polite");
    }
  }, [announce]);

  const handleResetBearing = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      map.resetNorth();
      announce("Map orientation reset to north", "polite");
    }
  }, [announce]);

  const handleResetPitch = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      map.setPitch(0);
      announce("Map pitch reset", "polite");
    }
  }, [announce]);

  const handleToggleSatellite = useCallback(() => {
    const map = getMapInstance();
    if (!map) return;

    const newStyle = isSatelliteView
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/satellite-streets-v12";

    map.setStyle(newStyle);
    setIsSatelliteView(!isSatelliteView);
    announce(
      isSatelliteView ? "Switched to dark map view" : "Switched to satellite view",
      "polite"
    );
  }, [isSatelliteView, announce]);

  const positionClasses = {
    "top-right": "u-absolute u-top-0 u-end-0 u-mt-40 u-me-2",
    "bottom-right": "u-absolute u-bottom-0 u-end-0 u-mb-4 u-me-4",
    "top-left": "u-absolute u-top-0 u-start-0 u-mt-4 u-ms-4",
    "bottom-left": "u-absolute u-bottom-0 u-start-0 u-mb-4 u-ms-4",
  };

  return (
    <div className={` ${positionClasses[position]} ${className}`}>
      <Card glass>
        <div
          className="u-flex u-flex-column u-gap-1"
          role="toolbar"
          aria-label="Map controls"
        >
          {/* Zoom controls */}
          <div
            className="u-flex u-flex-column u-gap-1"
            role="group"
            aria-label="Zoom controls"
          >
            <Button
              variant="secondary"
              size={"sm"}
              iconName="Plus"
              iconOnly
              onClick={handleZoomIn}
              aria-label="Zoom in"
            />
            <Button
              variant="secondary"
              size={"sm"}
              iconName="Minus"
              iconOnly
              onClick={handleZoomOut}
              aria-label="Zoom out"
            />
          </div>

          <div className="u-border-top u-border-solid u-border-secondary-subtle u-opacity-20 u-my-1" />

          {/* View mode controls */}
          <div
            className="u-flex u-flex-column u-gap-1"
            role="group"
            aria-label="View mode controls"
          >
            <Button
              variant={isSatelliteView ? "primary" : "secondary"}
              size={"sm"}
              iconName={isSatelliteView ? "GlobeHemisphereWest" : "Globe"}
              iconOnly
              onClick={handleToggleSatellite}
              aria-label={
                isSatelliteView ? "Switch to dark map view" : "Switch to satellite view"
              }
            />
          </div>

          <div className="u-border-top u-border-solid u-border-secondary-subtle u-opacity-20 u-my-1" />

          {/* Compass controls */}
          {showCompass && (
            <div
              className="u-flex u-flex-column u-gap-1"
              role="group"
              aria-label="Orientation controls"
            >
              <CompassControl size={"sm"} />
              <Button
                variant="secondary"
                size={"sm"}
                iconName="GlobeHemisphereWest"
                iconOnly
                onClick={handleResetPitch}
                aria-label="Reset pitch"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Enhanced controls component with bearing indicator
export const CompassControl: React.FC<{ size?: "sm" | "md" }> = ({ size = "md" }) => {
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    const map = getMapInstance();
    if (!map) return;

    const updateBearing = () => setBearing(map.getBearing());
    map.on("rotate", updateBearing);
    updateBearing();

    return () => {
      map.off("rotate", updateBearing);
    };
  }, []);

  const handleResetBearing = () => {
    const map = getMapInstance();
    if (map) map.resetNorth();
  };

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={handleResetBearing}
      aria-label={`Reset map orientation, current bearing: ${Math.round(bearing)} degrees`}
      iconOnly
      icon={
        <div
          style={{
            transform: `rotate(${-bearing}deg)`,
          }}
        >
          <Icon name="NavigationArrow" size={16} />
        </div>
      }
    ></Button>
  );
};

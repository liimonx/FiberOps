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

  const positionClasses = {
    "top-right": "u-absolute u-top-0 u-end-0 u-mt-4 u-me-4",
    "bottom-right": "u-absolute u-bottom-0 u-end-0 u-mb-4 u-me-4",
    "top-left": "u-absolute u-top-0 u-start-0 u-mt-4 u-ms-4",
    "bottom-left": "u-absolute u-bottom-0 u-start-0 u-mb-4 u-ms-4",
  };

  return (
    <div className={` ${positionClasses[position]} ${className}`}>
      <Card glass={true}>
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
              size={isMobile ? "sm" : "md"}
              iconName="Plus"
              iconOnly
              onClick={handleZoomIn}
              aria-label="Zoom in"
            />
            <Button
              variant="secondary"
              size={isMobile ? "sm" : "md"}
              iconName="Minus"
              iconOnly
              onClick={handleZoomOut}
              aria-label="Zoom out"
            />
          </div>

          <div className="u-border-top u-border-secondary-subtle u-opacity-20 u-my-1" />

          {/* Compass controls */}
          {showCompass && (
            <div
              className="u-flex u-flex-column u-gap-1"
              role="group"
              aria-label="Orientation controls"
            >
              <CompassControl size={isMobile ? "sm" : "md"} />
              <Button
                variant="secondary"
                size={isMobile ? "sm" : "md"}
                iconName="SlidersVertical"
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
      iconOnly
      onClick={handleResetBearing}
      aria-label={`Reset map orientation, current bearing: ${Math.round(bearing)} degrees`}
      className="u-relative"
    >
      <div className="u-flex u-items-center u-justify-center u-w-5 u-h-5">
        <div
          className="u-flex u-items-center u-justify-center u-transition-all"
          style={{
            transform: `rotate(${-bearing}deg)`,
          }}
          aria-hidden="true"
        >
          <Icon name="NavigationArrow" size={16} className="u-text-primary" />
        </div>
      </div>
    </Button>
  );
};

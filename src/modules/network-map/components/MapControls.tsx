"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Button, Card, Icon } from "@shohojdhara/atomix";
import { useMapInstance } from "../hooks/useMapInstance";
import { useAccessibilityAnnounce } from "./AccessibilityAnnouncer";
import {
  BUILDINGS_LAYER_ID,
  updateLayerVisibility,
} from "../utils/mapStyling";

interface MapControlsProps {
  className?: string;
  showCompass?: boolean;
  showBasemapToggle?: boolean;
  showBuildingsToggle?: boolean;
  showZoom?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  className = "",
  showCompass = true,
  showBasemapToggle = true,
  showBuildingsToggle = true,
  showZoom = true,
}) => {
  const mapInstance = useMapInstance();
  const { announce } = useAccessibilityAnnounce();
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [showBuildings, setShowBuildings] = useState(true);

  const applyBuildingsVisibility = useCallback(
    (visible: boolean) => {
      if (!mapInstance?.getLayer(BUILDINGS_LAYER_ID)) return;
      updateLayerVisibility(mapInstance, BUILDINGS_LAYER_ID, visible);
    },
    [mapInstance]
  );

  useEffect(() => {
    if (!mapInstance) return;

    const syncBuildings = () => applyBuildingsVisibility(showBuildings);
    syncBuildings();
    mapInstance.on("style.load", syncBuildings);

    return () => {
      mapInstance.off("style.load", syncBuildings);
    };
  }, [mapInstance, showBuildings, applyBuildingsVisibility]);

  const handleToggleBuildings = useCallback(() => {
    const next = !showBuildings;
    setShowBuildings(next);
    applyBuildingsVisibility(next);
    announce(next ? "3D buildings shown" : "3D buildings hidden", "polite");
  }, [showBuildings, applyBuildingsVisibility, announce]);

  const handleZoomIn = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomIn();
      announce("Map zoomed in", "polite");
    }
  }, [mapInstance, announce]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) {
      mapInstance.zoomOut();
      announce("Map zoomed out", "polite");
    }
  }, [mapInstance, announce]);

  const handleResetPitch = useCallback(() => {
    if (mapInstance) {
      mapInstance.setPitch(0);
      announce("Map pitch reset", "polite");
    }
  }, [mapInstance, announce]);

  const handleToggleSatellite = useCallback(() => {
    if (!mapInstance) return;

    const newStyle = isSatelliteView
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/satellite-streets-v12";

    mapInstance.setStyle(newStyle);
    mapInstance.once("style.load", () => applyBuildingsVisibility(showBuildings));
    setIsSatelliteView(!isSatelliteView);
    announce(
      isSatelliteView ? "Switched to dark map view" : "Switched to satellite view",
      "polite"
    );
  }, [mapInstance, isSatelliteView, showBuildings, applyBuildingsVisibility, announce]);

  return (
    <div className={className}>
      <Card>
        <div
          className="u-flex u-flex-column u-gap-1"
          role="toolbar"
          aria-label="Map controls"
        >
          {showZoom && (
            <div
              className="u-flex u-flex-column u-gap-1"
              role="group"
              aria-label="Zoom controls"
            >
              <Button
                variant="secondary"
                size="sm"
                iconName="Plus"
                iconOnly
                onClick={handleZoomIn}
                aria-label="Zoom in"
              />
              <Button
                variant="secondary"
                size="sm"
                iconName="Minus"
                iconOnly
                onClick={handleZoomOut}
                aria-label="Zoom out"
              />
            </div>
          )}

          {(showBasemapToggle || showBuildingsToggle) && showZoom && (
            <div className="u-border-top u-border-solid u-border-secondary-subtle u-opacity-20 u-my-1" />
          )}

          {(showBasemapToggle || showBuildingsToggle) && (
            <div
              className="u-flex u-flex-column u-gap-1"
              role="group"
              aria-label="View mode controls"
            >
              {showBasemapToggle && (
                <Button
                  variant={isSatelliteView ? "primary" : "secondary"}
                  size="sm"
                  iconName={isSatelliteView ? "GlobeHemisphereWest" : "Globe"}
                  iconOnly
                  onClick={handleToggleSatellite}
                  aria-label={
                    isSatelliteView
                      ? "Switch to dark map view"
                      : "Switch to satellite view"
                  }
                />
              )}
              {showBuildingsToggle && (
                <Button
                  variant={showBuildings ? "primary" : "secondary"}
                  size="sm"
                  iconName={showBuildings ? "Buildings" : "EyeSlash"}
                  iconOnly
                  onClick={handleToggleBuildings}
                  aria-label={
                    showBuildings ? "Hide 3D buildings" : "Show 3D buildings"
                  }
                />
              )}
            </div>
          )}

          {showCompass && (showZoom || showBasemapToggle || showBuildingsToggle) && (
            <div className="u-border-top u-border-solid u-border-secondary-subtle u-opacity-20 u-my-1" />
          )}

          {showCompass && (
            <div
              className="u-flex u-flex-column u-gap-1"
              role="group"
              aria-label="Orientation controls"
            >
              <CompassControl size="sm" />
              <Button
                variant="secondary"
                size="sm"
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

export const CompassControl: React.FC<{ size?: "sm" | "md" }> = ({ size = "md" }) => {
  const mapInstance = useMapInstance();
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    if (!mapInstance) return;

    const updateBearing = () => setBearing(mapInstance.getBearing());
    mapInstance.on("rotate", updateBearing);
    updateBearing();

    return () => {
      mapInstance.off("rotate", updateBearing);
    };
  }, [mapInstance]);

  const handleResetBearing = () => {
    mapInstance?.resetNorth();
  };

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={handleResetBearing}
      aria-label={`Reset map orientation, current bearing: ${Math.round(bearing)} degrees`}
      iconOnly
      icon={
        <div style={{ transform: `rotate(${-bearing}deg)` }}>
          <Icon name="NavigationArrow" size={16} />
        </div>
      }
    />
  );
};

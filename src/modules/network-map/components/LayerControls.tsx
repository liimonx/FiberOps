"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Icon,
  Toggle,
  Button,
  Badge,
  Accordion,
} from "@shohojdhara/atomix";
import {
  useNetworkMapStore,
  useLayers,
  useNodes,
  useConnections,
} from "../stores/useNetworkMapStore";
import { LAYER_CONFIGS } from "../constants/layerConfig";
import { useLayerStats } from "../hooks/useLayerStats";
import { useResponsive } from "../hooks/useResponsive";
import { useAccessibilityAnnounce } from "./AccessibilityAnnouncer";

interface LayerControlsProps {
  className?: string;
  defaultExpanded?: boolean;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  className = "",
  defaultExpanded,
}) => {
  const { isMobile } = useResponsive();
  const layers = useLayers();
  const nodes = useNodes();
  const connections = useConnections();
  const layerStats = useLayerStats(nodes, connections);
  const toggleLayer = useNetworkMapStore((state) => state.toggleLayer);
  const setLayerVisibility = useNetworkMapStore((state) => state.setLayerVisibility);
  const updateLayers = useNetworkMapStore((state) => state.updateLayers);
  const { announce } = useAccessibilityAnnounce();

  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(
    defaultExpanded ?? !isMobile
  );

  // Sync expansion to the responsive breakpoint without a setState-in-effect.
  // Adjusting state during render is React's recommended pattern for deriving
  // from a changed input while still allowing manual user toggles.
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile);
    if (defaultExpanded === undefined) {
      setExpanded(!isMobile);
    }
  }

  useEffect(() => {
    const missingLayers = LAYER_CONFIGS.filter(
      (config) => !layers.some((l) => l.id === config.id)
    );
    if (missingLayers.length > 0) {
      const updatedLayers = [
        ...layers,
        ...missingLayers.map((config) => ({
          id: config.id,
          name: config.name,
          visible: config.visible,
          type: config.type,
        })),
      ];
      updateLayers(updatedLayers);
    }
  }, [layers, updateLayers]);

  const handleToggle = (layerId: string, layerName: string) => {
    toggleLayer(layerId);
    const layer = layers.find((l) => l.id === layerId);
    const nextVisible = layer ? !layer.visible : true;
    announce(
      `${layerName} layer ${nextVisible ? "shown" : "hidden"}`,
      "polite"
    );
  };

  const activeCount = useMemo(() => layers.filter((l) => l.visible).length, [layers]);
  const totalLayers = LAYER_CONFIGS.length;

  const handleToggleAll = (visible: boolean) => {
    layers.forEach((layer) => {
      setLayerVisibility(layer.id, visible);
    });
    announce(visible ? "All layers shown" : "All layers hidden", "polite");
  };

  if (!expanded) {
    return (
      <Button
        variant="secondary"
        size="sm"
        iconName="Stack"
        onClick={() => setExpanded(true)}
        aria-label={`Map layers, ${activeCount} of ${totalLayers} visible`}
        className={className}
      >
        Layers ({activeCount}/{totalLayers})
      </Button>
    );
  }

  return (
    <div className={`u-relative ${className}`.trim()}>
      <Accordion title="" glass icon={<Icon name="Stack" />}>
        <Accordion.Header>
          <div className={`u-w-100 ${isMobile ? "u-pe-8" : ""}`.trim()}>
            <div className="u-flex u-items-center u-gap-3">
              <div className="u-rounded-circle u-bg-primary u-text-white u-shadow-lg u-p-2">
                <Icon name="Stack" size={20} weight="bold" />
              </div>
              <div className="u-sm-flex u-none u-flex-column u-text-start">
                <span className="u-text-base u-font-bold u-text-primary">Map Layers</span>
                <span className="u-text-xs u-text-secondary-emphasis u-opacity-75">
                  {activeCount} of {totalLayers} visibility layers
                </span>
              </div>
            </div>
          </div>
        </Accordion.Header>

      <Accordion.Body className="u-border-primary-subtle u-shadow-lg">
        <div
          className="u-overflow-y-auto u-flex u-flex-column u-gap-2 u-h-90"
          role="group"
          aria-label="Map layers"
        >
          {LAYER_CONFIGS.map((config) => {
            const layer = layers.find((l) => l.id === config.id);
            const isVisible = layer?.visible ?? config.visible;
            const isHovered = hoveredLayer === config.id;
            const stats = layerStats[config.id];
            const hasAlerts = stats && stats.alerts > 0;

            return (
              <div
                key={config.id}
                className={`u-rounded-sm u-transition-base u-border u-border-transparent ${
                  isHovered
                    ? "u-bg-surface-hover u-border-primary-subtle u-shadow-sm"
                    : "u-bg-surface-subtle"
                } ${isVisible ? "u-opacity-100" : "u-opacity-50"}`}
                onMouseEnter={() => setHoveredLayer(config.id)}
                onMouseLeave={() => setHoveredLayer(null)}
              >
                <div className="u-flex u-items-center u-gap-3 u-p-2">
                  <div className="u-relative">
                    <div
                      className="u-rounded u-flex u-items-center u-justify-center u-p-2 u-shadow-sm"
                      style={{
                        backgroundColor: `${config.color}15`,
                        border: `1px solid ${config.color}30`,
                      }}
                    >
                      <Icon
                        name={config.icon}
                        size="sm"
                        style={{ color: config.color }}
                        weight={isVisible ? "duotone" : "regular"}
                      />
                    </div>
                    {hasAlerts && isVisible && (
                      <div className="u-absolute u-top-0 u-end-0 u-w-3 u-h-3 u-rounded-circle u-border-white u-border-solid u-border-2 u-bg-error u-translate-middle" />
                    )}
                  </div>

                  <div className="u-flex u-flex-column u-flex-1 u-min-w-0">
                    <div className="u-flex u-items-center u-justify-between u-gap-2">
                      <span
                        className={`u-text-sm u-font-bold u-text-truncate ${isVisible ? "u-text-primary" : "u-text-secondary"}`}
                      >
                        {config.name}
                      </span>
                      {stats && isVisible && stats.total > 0 && (
                        <Badge
                          variant={hasAlerts ? "error" : "success"}
                          label={
                            hasAlerts
                              ? `${stats.alerts} Issues`
                              : `${stats.active}/${stats.total}`
                          }
                          className="u-text-xs u-py-0 u-px-1"
                        />
                      )}
                    </div>
                    <span className="u-text-xs u-text-secondary-emphasis u-text-truncate u-opacity-70">
                      {config.description}
                    </span>
                  </div>

                  <div className="u-ms-auto">
                    <Toggle
                      checked={isVisible}
                      onChange={() => handleToggle(config.id, config.name)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="u-flex u-gap-2 u-p-3">
          <Button
            variant="primary"
            fullWidth
            size="sm"
            onClick={() => handleToggleAll(true)}
            disabled={activeCount === totalLayers}
            iconName="Eye"
          >
            Enable All
          </Button>
          <Button
            variant="secondary"
            fullWidth
            size="sm"
            onClick={() => handleToggleAll(false)}
            disabled={activeCount === 0}
            iconName="EyeSlash"
          >
            Disable All
          </Button>
        </div>
      </Accordion.Body>
      </Accordion>
      {isMobile && (
        <Button
          variant="secondary"
          size="sm"
          iconName="X"
          iconOnly
          onClick={() => setExpanded(false)}
          aria-label="Collapse layer controls"
          className="u-absolute u-top-3 u-end-9 u-z-1"
        />
      )}
    </div>
  );
};

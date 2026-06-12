"use client";

import { useCallback, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { NetworkNode, NetworkConnection } from "../types";
import { useTooltipHover } from "./useTooltipHover";
import {
  createNodeTooltipContent,
  createConnectionTooltipContent,
  TooltipContentCallbacks,
} from "../utils/tooltipContent";

export interface HoverTarget {
  node: NetworkNode | null;
  connection: NetworkConnection | null;
}

export interface UseMapHoverTooltipOptions {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  enabled: boolean;
  callbacks: TooltipContentCallbacks;
  showDelay?: number;
  hideDelay?: number;
}

export function useMapHoverTooltip({
  nodes,
  connections,
  enabled,
  callbacks,
  showDelay = 200,
  hideDelay = 300,
}: UseMapHoverTooltipOptions) {
  const {
    tooltip,
    showTooltip,
    hideTooltip,
    handleMouseEnter,
    handleMouseLeave,
  } = useTooltipHover({ delay: hideDelay, showDelay });

  const [hoverTarget, setHoverTarget] = useState<HoverTarget>({
    node: null,
    connection: null,
  });

  const clearHoverTarget = useCallback(() => {
    setHoverTarget((prev) =>
      prev.node || prev.connection ? { node: null, connection: null } : prev
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      hideTooltip(true);
      clearHoverTarget();
    }
  }, [enabled, hideTooltip, clearHoverTarget]);

  const handleNodeHover = useCallback(
    (nodeId: string | null, event: mapboxgl.MapMouseEvent) => {
      if (!enabled) {
        return;
      }

      if (!nodeId) {
        hideTooltip();
        clearHoverTarget();
        return;
      }

      const node = nodes.find((n) => n.id === nodeId);
      if (node && event.point) {
        setHoverTarget({ node, connection: null });
        const content = createNodeTooltipContent(node, callbacks);
        showTooltip(content, event.point.x, event.point.y);
      }
    },
    [enabled, nodes, callbacks, showTooltip, hideTooltip, clearHoverTarget]
  );

  const handleConnectionHover = useCallback(
    (connectionId: string | null, event: mapboxgl.MapMouseEvent) => {
      if (!enabled) {
        return;
      }

      if (!connectionId) {
        hideTooltip();
        clearHoverTarget();
        return;
      }

      const connection = connections.find((c) => c.id === connectionId);
      if (connection && event.point) {
        setHoverTarget({ node: null, connection });
        const content = createConnectionTooltipContent(connection, callbacks);
        showTooltip(content, event.point.x, event.point.y);
      }
    },
    [enabled, connections, callbacks, showTooltip, hideTooltip, clearHoverTarget]
  );

  return {
    tooltip,
    hoverTarget,
    handleNodeHover,
    handleConnectionHover,
    handleTooltipMouseEnter: handleMouseEnter,
    handleTooltipMouseLeave: handleMouseLeave,
    hideTooltip,
  };
}

"use client";

import { useMemo } from "react";
import {
  ConnectionType,
  NetworkConnection,
  NetworkNode,
  NetworkNodeType,
  NetworkStatus,
} from "../types";
import { LAYER_CONFIGS } from "../constants/layerConfig";

export interface LayerStats {
  total: number;
  active: number;
  alerts: number;
}

const ALERT_STATUSES = new Set<NetworkStatus>([
  NetworkStatus.ERROR,
  NetworkStatus.WARNING,
  NetworkStatus.DEGRADED,
]);

function isAlertStatus(status: NetworkStatus): boolean {
  return ALERT_STATUSES.has(status);
}

function nodeBelongsToLayer(node: NetworkNode, layerId: string): boolean {
  switch (layerId) {
    case "infrastructure":
      return [
        NetworkNodeType.CORE_NODE,
        NetworkNodeType.DISTRIBUTION_NODE,
        NetworkNodeType.ACCESS_NODE,
      ].includes(node.type);
    case "pops":
      return node.type === NetworkNodeType.POP;
    case "junction-boxes":
      return node.type === NetworkNodeType.JUNCTION_BOX;
    case "splitters":
      return node.type === NetworkNodeType.SPLITTER;
    case "poles":
      return node.type === NetworkNodeType.POLE;
    case "onus":
      return node.type === NetworkNodeType.ONU;
    case "customers":
      return node.type === NetworkNodeType.CUSTOMER;
    default:
      return false;
  }
}

function connectionBelongsToLayer(connection: NetworkConnection, layerId: string): boolean {
  switch (layerId) {
    case "fiber-routes":
      return connection.type === ConnectionType.FIBER_ROUTE;
    case "customer-connections":
      return connection.type === ConnectionType.CUSTOMER_CONNECTION;
    default:
      return false;
  }
}

function summarize(items: { status: NetworkStatus }[]): LayerStats {
  const total = items.length;
  const active = items.filter((i) => i.status === NetworkStatus.ACTIVE).length;
  const alerts = items.filter((i) => isAlertStatus(i.status)).length;
  return { total, active, alerts };
}

export function useLayerStats(
  nodes: NetworkNode[],
  connections: NetworkConnection[]
): Record<string, LayerStats> {
  return useMemo(() => {
    const stats: Record<string, LayerStats> = {};

    for (const config of LAYER_CONFIGS) {
      if (config.type === "nodes" || config.type === "customers") {
        const matched = nodes.filter((n) => nodeBelongsToLayer(n, config.id));
        stats[config.id] = summarize(matched);
      } else if (config.type === "connections") {
        const matched = connections.filter((c) =>
          connectionBelongsToLayer(c, config.id)
        );
        stats[config.id] = summarize(matched);
      } else if (config.id === "outages") {
        const outageItems = [
          ...nodes.filter((n) => isAlertStatus(n.status)),
          ...connections.filter((c) => isAlertStatus(c.status)),
        ];
        stats[config.id] = {
          total: outageItems.length,
          active: outageItems.length,
          alerts: outageItems.length,
        };
      } else if (config.id === "coverage") {
        stats[config.id] = {
          total: nodes.length > 0 ? 1 : 0,
          active: nodes.length > 0 ? 1 : 0,
          alerts: 0,
        };
      } else {
        stats[config.id] = { total: 0, active: 0, alerts: 0 };
      }
    }

    return stats;
  }, [nodes, connections]);
}

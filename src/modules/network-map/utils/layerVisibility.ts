import type { NetworkMapLayer } from "../types";
import { ConnectionType, NetworkNodeType } from "../types";

/** Node types to draw based on layer toggles (matches MapCanvas / LayerControls ids). */
export function visibleNodeTypesFromLayers(layers: NetworkMapLayer[]): NetworkNodeType[] {
  const types = layers
    .filter((l) => l.visible && (l.type === "nodes" || l.type === "customers"))
    .flatMap((l) => {
      switch (l.id) {
        case "infrastructure":
          return [
            NetworkNodeType.CORE_NODE,
            NetworkNodeType.DISTRIBUTION_NODE,
            NetworkNodeType.ACCESS_NODE,
          ];
        case "pops":
          return [NetworkNodeType.POP];
        case "poles":
          return [NetworkNodeType.POLE];
        case "junction-boxes":
          return [NetworkNodeType.JUNCTION_BOX];
        case "splitters":
          return [NetworkNodeType.SPLITTER];
        case "onus":
          return [NetworkNodeType.ONU];
        case "customers":
          return [NetworkNodeType.CUSTOMER];
        default:
          return [];
      }
    });
  return Array.from(new Set(types));
}

export function visibleConnectionTypesFromLayers(layers: NetworkMapLayer[]): ConnectionType[] {
  const types = layers
    .filter((l) => l.visible && l.type === "connections")
    .flatMap((l) => {
      if (l.id === "fiber-routes") return [ConnectionType.FIBER_ROUTE];
      if (l.id === "customer-connections") return [ConnectionType.CUSTOMER_CONNECTION];
      return [];
    });
  return Array.from(new Set(types));
}

export function isOutagesLayerVisible(layers: NetworkMapLayer[]): boolean {
  return layers.some((l) => l.id === "outages" && l.visible);
}

export function isCoverageLayerVisible(layers: NetworkMapLayer[]): boolean {
  return layers.some((l) => l.id === "coverage" && l.visible);
}

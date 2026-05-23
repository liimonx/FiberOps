import { PhosphorIconsType } from "@shohojdhara/atomix";
import { NetworkNode, NetworkConnection } from "../types";
import type { TooltipContent } from "../components/InteractiveTooltip";

export interface TooltipContentCallbacks {
  onViewDetails?: (id: string) => void;
  onTracePath?: (nodeId: string) => void;
  onViewRoute?: (connectionId: string) => void;
  onCheckHealth?: (connectionId: string) => void;
}

export const createNodeTooltipContent = (
  node: NetworkNode,
  callbacks: TooltipContentCallbacks = {}
): TooltipContent => ({
  title: node.name,
  status: node.status,
  details: [
    { label: "Type", value: node.type, icon: "Tag" as PhosphorIconsType },
    { label: "ID", value: node.id, icon: "Fingerprint" as PhosphorIconsType },
    ...(node.capacity
      ? [
          {
            label: "Capacity",
            value: `${node.capacity} ports`,
            icon: "HardDrives" as PhosphorIconsType,
          },
        ]
      : []),
    ...(node.utilization !== undefined
      ? [
          {
            label: "Utilization",
            value: `${node.utilization}%`,
            icon: "Gauge" as PhosphorIconsType,
          },
        ]
      : []),
    {
      label: "Location",
      value: `${node.position.lat.toFixed(4)}, ${node.position.lng.toFixed(4)}`,
      icon: "MapPin" as PhosphorIconsType,
    },
  ],
  actions: [
    {
      label: "View Details",
      icon: "Eye" as PhosphorIconsType,
      onClick: () => callbacks.onViewDetails?.(node.id),
      variant: "primary",
    },
    {
      label: "Trace Path",
      icon: "GitBranch" as PhosphorIconsType,
      onClick: () => callbacks.onTracePath?.(node.id),
      variant: "secondary",
    },
  ],
  metadata: node.metadata,
});

export const createConnectionTooltipContent = (
  connection: NetworkConnection,
  callbacks: TooltipContentCallbacks = {}
): TooltipContent => {
  const { bandwidth, utilization } = connection;
  const currentSpeed =
    bandwidth && utilization !== undefined ? (bandwidth * utilization) / 100 : null;

  return {
    title: `Connection ${connection.id}`,
    status: connection.status,
    details: [
      {
        label: "From",
        value: connection.sourceNodeId,
        icon: "ArrowRight" as PhosphorIconsType,
      },
      {
        label: "To",
        value: connection.targetNodeId,
        icon: "ArrowLeft" as PhosphorIconsType,
      },
      ...(bandwidth
        ? [
            {
              label: "Bandwidth",
              value: `${bandwidth} Mbps`,
              icon: "Lightning" as PhosphorIconsType,
            },
          ]
        : []),
      ...(currentSpeed !== null
        ? [
            {
              label: "Current Speed",
              value: `${currentSpeed.toFixed(2)} Mbps`,
              icon: "TrendUp" as PhosphorIconsType,
            },
          ]
        : []),
      ...(utilization !== undefined
        ? [
            {
              label: "Utilization",
              value: `${utilization}%`,
              icon: "Gauge" as PhosphorIconsType,
            },
          ]
        : []),
    ],
    actions: [
      {
        label: "View Route",
        icon: "MapTrifold" as PhosphorIconsType,
        onClick: () => callbacks.onViewRoute?.(connection.id),
        variant: "primary",
      },
      {
        label: "Check Health",
        icon: "Heartbeat" as PhosphorIconsType,
        onClick: () => callbacks.onCheckHealth?.(connection.id),
        variant: "secondary",
      },
    ],
  };
};

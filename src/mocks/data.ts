import type { Asset, Customer, Incident } from "@/types/domain";

export const assets: Asset[] = [
  {
    id: "ast_pole_0001",
    kind: "pole",
    name: "Pole 0001",
    status: "active",
    location: { lat: 41.3874, lng: 2.1686 },
  },
  {
    id: "ast_jbox_0007",
    kind: "junction_box",
    name: "Junction Box 0007",
    status: "degraded",
    location: { lat: 41.389, lng: 2.1649 },
  },
];

export const customers: Customer[] = [
  { id: "cus_0001", name: "Carrer Example 12, 3-2", plan: "1Gbps", status: "online" },
  { id: "cus_0002", name: "Avinguda Demo 55, 1-1", plan: "300Mbps", status: "offline" },
];

export const incidents: Incident[] = [
  {
    id: "inc_0001",
    title: "Signal loss in Zone 3",
    severity: "high",
    status: "investigating",
    relatedAssetId: "ast_jbox_0007",
  },
];


import { describe, it, expect } from "vitest";
import {
  calculateMatchScore,
  formatConnectionLabel,
  searchNetworkAssets,
} from "./assetSearch";
import {
  ConnectionType,
  NetworkConnection,
  NetworkNode,
  NetworkNodeType,
  NetworkStatus,
} from "../types";

const nodes: NetworkNode[] = [
  {
    id: "node-alpha",
    name: "Alpha POP",
    type: NetworkNodeType.POP,
    position: { lat: 23.81, lng: 90.41 },
    status: NetworkStatus.ACTIVE,
  },
  {
    id: "splitter-08",
    name: "Splitter S-08",
    type: NetworkNodeType.SPLITTER,
    position: { lat: 23.82, lng: 90.42 },
    status: NetworkStatus.ACTIVE,
  },
  {
    id: "cust-8012",
    name: "Acme Corp",
    type: NetworkNodeType.CUSTOMER,
    position: { lat: 23.83, lng: 90.43 },
    status: NetworkStatus.ACTIVE,
  },
];

const connections: NetworkConnection[] = [
  {
    id: "conn-trunk-01",
    sourceNodeId: "node-alpha",
    targetNodeId: "splitter-08",
    type: ConnectionType.FIBER_ROUTE,
    status: NetworkStatus.ACTIVE,
  },
  {
    id: "conn-drop-acme",
    sourceNodeId: "splitter-08",
    targetNodeId: "cust-8012",
    type: ConnectionType.CUSTOMER_CONNECTION,
    status: NetworkStatus.ACTIVE,
  },
];

describe("calculateMatchScore", () => {
  it("ranks exact matches highest", () => {
    expect(calculateMatchScore("Alpha POP", "alpha pop")).toBe(1);
    expect(calculateMatchScore("Alpha POP", "alpha")).toBe(0.8);
  });
});

describe("formatConnectionLabel", () => {
  it("uses endpoint names when available", () => {
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const label = formatConnectionLabel(connections[0], nodeById);
    expect(label.name).toBe("Alpha POP → Splitter S-08");
    expect(label.detail).toContain("Fiber route");
    expect(label.detail).toContain("conn-trunk-01");
  });
});

describe("searchNetworkAssets", () => {
  it("finds connections by endpoint name", () => {
    const results = searchNetworkAssets(nodes, connections, "acme", "all");
    expect(results.some((r) => r.id === "conn-drop-acme")).toBe(true);
  });

  it("finds connections by type label", () => {
    const results = searchNetworkAssets(nodes, connections, "fiber route", "connections");
    expect(results.some((r) => r.id === "conn-trunk-01")).toBe(true);
  });

  it("filters customers category", () => {
    const results = searchNetworkAssets(nodes, connections, "acme", "customers");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("cust-8012");
    expect(results[0].category).toBe("customers");
  });

  it("excludes customers from nodes category", () => {
    const results = searchNetworkAssets(nodes, connections, "acme", "nodes");
    expect(results).toHaveLength(0);
  });

  it("finds nodes by id", () => {
    const results = searchNetworkAssets(nodes, connections, "splitter-08", "nodes");
    expect(results[0]?.id).toBe("splitter-08");
  });
});

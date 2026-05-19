"use client";

import React, { useMemo } from "react";
import { Card, Button, Icon } from "@shohojdhara/atomix";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { NetworkNodeType, LatLng } from "../types";

export const ImpairmentAreaPanel: React.FC = () => {
  const impairmentArea = useNetworkMapStore((state) => state.impairmentArea);
  const setImpairmentArea = useNetworkMapStore((state) => state.setImpairmentArea);
  const nodes = useNetworkMapStore((state) => state.nodes);
  const connections = useNetworkMapStore((state) => state.connections);
  const simulatedOutageActive = useNetworkMapStore(
    (state) => state.simulatedOutageActive
  );
  const simulateImpairmentOutage = useNetworkMapStore(
    (state) => state.simulateImpairmentOutage
  );
  const restoreImpairmentServices = useNetworkMapStore(
    (state) => state.restoreImpairmentServices
  );

  // Haversine formula
  const getDistance = (p1: LatLng, p2: LatLng) => {
    const R = 6371e3; // meters
    const phi1 = (p1.lat * Math.PI) / 180;
    const phi2 = (p2.lat * Math.PI) / 180;
    const dPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const impactData = useMemo(() => {
    if (!impairmentArea) return { nodes: [], connections: [], customersCount: 0 };

    const impactedNodes = nodes.filter(
      (n) => getDistance(impairmentArea.center, n.position) <= impairmentArea.radius
    );

    const impactedNodeIds = new Set(impactedNodes.map((n) => n.id));

    const impactedConnections = connections.filter(
      (c) =>
        impactedNodeIds.has(c.sourceNodeId) || impactedNodeIds.has(c.targetNodeId)
    );

    // Simple calculation: customers physically in the blast radius
    const customersCount = impactedNodes.filter(
      (n) => n.type === NetworkNodeType.CUSTOMER
    ).length;

    return {
      nodes: impactedNodes,
      connections: impactedConnections,
      customersCount,
    };
  }, [impairmentArea, nodes, connections]);

  if (!impairmentArea) {
    return (
      <Card className="u-p-4 u-w-100">
        <div className="u-flex u-items-center u-gap-2">
          <Icon name="Info" size={20} className="u-text-secondary" />
          <span className="u-text-sm u-text-secondary">Click on the map to define the impairment blast radius.</span>
        </div>
      </Card>
    );
  }

  const handleSimulate = () => {
    simulateImpairmentOutage(
      impactData.nodes.map((n) => n.id),
      impactData.connections.map((c) => c.id)
    );
  };

  const handleClear = () => {
    if (simulatedOutageActive) {
      restoreImpairmentServices();
    }
    setImpairmentArea(null);
  };

  return (
    <Card className="u-p-4 u-w-100">
      <div className="u-flex u-items-center u-justify-between u-mb-4">
        <h3 className="u-m-0 u-text-sm u-font-bold u-flex u-items-center u-gap-2">
          <Icon name="Warning" size={16} className="u-text-error" />
          Impairment Area
        </h3>
      </div>

      <div className="u-mb-4">
        <label className="u-block u-text-xs u-text-secondary u-mb-2">
          Radius: {impairmentArea.radius}m
        </label>
        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={impairmentArea.radius}
          onChange={(e) =>
            setImpairmentArea({ ...impairmentArea, radius: Number(e.target.value) })
          }
          className="u-w-100"
          disabled={simulatedOutageActive}
        />
      </div>

      <div className="u-flex u-flex-column u-gap-2 u-mb-4">
        <div className="u-flex u-justify-between u-text-xs">
          <span className="u-text-secondary">Impacted Nodes:</span>
          <strong>{impactData.nodes.length}</strong>
        </div>
        <div className="u-flex u-justify-between u-text-xs">
          <span className="u-text-secondary">Impacted Connections:</span>
          <strong>{impactData.connections.length}</strong>
        </div>
        <div className="u-flex u-justify-between u-text-xs">
          <span className="u-text-secondary">Affected Customers:</span>
          <strong>{impactData.customersCount}</strong>
        </div>
      </div>

      <div className="u-flex u-gap-2">
        {!simulatedOutageActive ? (
          <Button
            variant="primary"
            size="sm"
            className="u-flex-1"
            onClick={handleSimulate}
            disabled={impactData.nodes.length === 0}
          >
            Simulate Outage
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="u-flex-1"
            onClick={restoreImpairmentServices}
          >
            Restore Services
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </Card>
  );
};

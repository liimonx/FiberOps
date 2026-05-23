"use client";

import React, { useMemo } from "react";
import { Card, Button, Icon } from "@shohojdhara/atomix";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { computeImpairmentImpact } from "../utils/impairmentUtils";

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

  const impactData = useMemo(() => {
    if (!impairmentArea) {
      return { nodes: [], connections: [], customersCount: 0 };
    }
    return computeImpairmentImpact(impairmentArea, nodes, connections);
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

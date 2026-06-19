"use client";

import Link from "next/link";
import { Button, Callout, Icon } from "@shohojdhara/atomix";
import {
  incidentCalloutVariant,
  sortActiveIncidents,
} from "@/lib/dashboardMetrics";
import { formatRelativeTimeFromIso } from "@/lib/operationsViewMappers";
import type { Incident } from "@/types/domain";

type ActiveOutagesPanelProps = {
  incidents: Incident[];
  isLoading?: boolean;
  limit?: number;
};

export function ActiveOutagesPanel({
  incidents,
  isLoading = false,
  limit = 3,
}: ActiveOutagesPanelProps) {
  if (isLoading) {
    return (
      <div className="u-flex u-flex-column u-gap-4" aria-busy="true">
        <div className="u-skeleton u-h-24 u-w-100" aria-hidden="true" />
        <div className="u-skeleton u-h-24 u-w-100" aria-hidden="true" />
      </div>
    );
  }

  const active = sortActiveIncidents(incidents).slice(0, limit);

  if (active.length === 0) {
    return (
      <Callout variant="success" title="All systems operational" icon={<Icon name="CheckCircle" />}>
        <p className="u-body-sm u-mb-0">
          No active outages. Network health is stable across all nodes.
        </p>
      </Callout>
    );
  }

  return (
    <div className="u-flex u-flex-column u-gap-4">
      {active.map((incident) => (
        <Callout
          key={incident.id}
          variant={incidentCalloutVariant(incident.severity)}
          title={incident.title}
          icon={
            <Icon
              name={
                incident.severity === "critical" || incident.severity === "high"
                  ? "Warning"
                  : "CellSignalHigh"
              }
            />
          }
        >
          <div className="u-flex u-justify-between u-items-center u-mb-1">
            <span className="u-meta">{incident.id}</span>
            <span className="u-meta">
              {formatRelativeTimeFromIso(incident.createdAt)}
            </span>
          </div>
          <p className="u-body-sm u-mb-3">
            {incident.notes ?? "Active incident affecting network operations."}
          </p>
          <Link
            href={`/incidents?selected=${incident.id}`}
            className="u-text-decoration-none"
          >
            <Button variant="outline-secondary" size="sm">
              View incident
            </Button>
          </Link>
        </Callout>
      ))}
    </div>
  );
}

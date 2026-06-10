import type { Incident } from "@/types/domain";

export type IncidentTimelineEvent = {
  id: string;
  label: string;
  timestamp: string;
  actor?: string;
};

const statusLabels: Record<Incident["status"], string> = {
  new: "Incident reported",
  investigating: "Investigation started",
  assigned: "Technician assigned",
  resolved: "Incident resolved",
};

export function buildIncidentTimeline(incident: Incident): IncidentTimelineEvent[] {
  const events: IncidentTimelineEvent[] = [
    {
      id: `${incident.id}-created`,
      label: "Incident reported",
      timestamp: incident.createdAt,
    },
  ];

  if (incident.status !== "new") {
    events.push({
      id: `${incident.id}-investigating`,
      label: statusLabels.investigating,
      timestamp: incident.updatedAt,
      actor: incident.technician,
    });
  }

  if (incident.status === "assigned" || incident.status === "resolved") {
    events.push({
      id: `${incident.id}-assigned`,
      label: statusLabels.assigned,
      timestamp: incident.updatedAt,
      actor: incident.technician,
    });
  }

  if (incident.status === "resolved" && incident.resolvedAt) {
    events.push({
      id: `${incident.id}-resolved`,
      label: statusLabels.resolved,
      timestamp: incident.resolvedAt,
      actor: incident.technician,
    });
  }

  return events;
}

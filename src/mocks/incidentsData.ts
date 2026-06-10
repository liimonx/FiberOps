import type {
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/domain";

const technicians = [
  "Jordan Lee",
  "Sam Rivera",
  "Taylor Chen",
  "Alex Morgan",
] as const;

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const seedIncidents: Incident[] = [
  {
    id: "inc-001",
    title: "Fiber cut on Main Street - Road 12 intersection",
    severity: "critical",
    status: "investigating",
    relatedAssetId: "pole-main-st-01",
    technician: technicians[0],
    notes:
      "Field team dispatched to Main Street intersection. Fiber span appears severed by construction work.",
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(2),
  },
  {
    id: "inc-002",
    title: "Signal degradation at Mohakhali Junction",
    severity: "high",
    status: "assigned",
    relatedAssetId: "jb-mohakhali-01",
    technician: technicians[1],
    notes: "Monitoring signal levels. Suspected moisture ingress in junction box.",
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(4),
  },
  {
    id: "inc-003",
    title: "ONU offline - Ahmed Plaza",
    severity: "medium",
    status: "new",
    relatedAssetId: "onu-cust-003",
    technician: technicians[2],
    notes: "Customer reported total loss of service. ONU not responding to ping.",
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
  {
    id: "inc-004",
    title: "Scheduled maintenance - Mohakhali fiber link",
    severity: "low",
    status: "investigating",
    relatedAssetId: "fiber-route-002",
    technician: technicians[3],
    notes: "Planned splice inspection during low-traffic window.",
    createdAt: hoursAgo(24),
    updatedAt: hoursAgo(8),
  },
];

let incidents: Incident[] = seedIncidents.map((incident) => ({ ...incident }));

function nextIncidentId(): string {
  const max = incidents.reduce((acc, inc) => {
    const num = Number.parseInt(inc.id.replace("inc-", ""), 10);
    return Number.isNaN(num) ? acc : Math.max(acc, num);
  }, 0);
  return `inc-${String(max + 1).padStart(3, "0")}`;
}

export function getIncidents(): Incident[] {
  return incidents.map((incident) => ({ ...incident }));
}

export function getIncidentById(id: string): Incident | undefined {
  const incident = incidents.find((item) => item.id === id);
  return incident ? { ...incident } : undefined;
}

export type CreateIncidentInput = {
  title: string;
  severity: IncidentSeverity;
  relatedAssetId?: string;
  notes?: string;
};

export function createIncident(data: CreateIncidentInput): Incident {
  const now = new Date().toISOString();
  const incident: Incident = {
    id: nextIncidentId(),
    title: data.title,
    severity: data.severity,
    status: "new",
    relatedAssetId: data.relatedAssetId,
    notes: data.notes,
    technician: technicians[incidents.length % technicians.length],
    createdAt: now,
    updatedAt: now,
  };
  incidents = [incident, ...incidents];
  return { ...incident };
}

export type UpdateIncidentInput = {
  status?: IncidentStatus;
  notes?: string;
  technician?: string;
  resolutionNotes?: string;
};

export function updateIncident(
  id: string,
  patch: UpdateIncidentInput
): Incident {
  const index = incidents.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("Incident not found");
  }

  const existing = incidents[index];
  const now = new Date().toISOString();
  const updated: Incident = {
    ...existing,
    ...patch,
    updatedAt: now,
    resolvedAt:
      patch.status === "resolved"
        ? now
        : patch.status
          ? existing.resolvedAt
          : existing.resolvedAt,
  };

  incidents = [
    ...incidents.slice(0, index),
    updated,
    ...incidents.slice(index + 1),
  ];
  return { ...updated };
}

export function resolveIncident(
  id: string,
  resolutionNotes: string
): Incident {
  return updateIncident(id, {
    status: "resolved",
    resolutionNotes,
    notes: resolutionNotes,
  });
}

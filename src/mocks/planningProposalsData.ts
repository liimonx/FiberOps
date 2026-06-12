import type {
  PlanningProposal,
  ProposalStatus,
  ProposalType,
} from "@/types/domain";

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const owners = [
  "Jordan Lee",
  "Sam Rivera",
  "Taylor Chen",
  "Alex Morgan",
] as const;

const seedProposals: PlanningProposal[] = [
  {
    id: "prop-001",
    title: "Gulshan North Fiber Expansion",
    description:
      "Extend distribution fiber from Gulshan PoP to underserved residential blocks north of Road 12.",
    type: "fiber_expansion",
    status: "approved",
    targetArea: "Gulshan North",
    relatedAssetId: "pop-gulshan-01",
    estimatedNewCustomers: 240,
    currentUtilizationPercent: 78,
    projectedUtilizationPercent: 62,
    estimatedBudgetUsd: 185000,
    budgetLineItems: [
      { category: "Fiber cable & conduit", amountUsd: 95000 },
      { category: "Splicing & labor", amountUsd: 52000 },
      { category: "Permits & ROW", amountUsd: 18000 },
      { category: "Equipment (splitters)", amountUsd: 20000 },
    ],
    areas: [
      {
        type: "circle",
        center: { lat: 23.7935, lng: 90.4085 },
        radiusMeters: 800,
      },
    ],
    routes: [
      {
        waypoints: [
          { lat: 23.7925, lng: 90.4078 },
          { lat: 23.7935, lng: 90.4085 },
          { lat: 23.7945, lng: 90.4072 },
          { lat: 23.795, lng: 90.409 },
        ],
      },
    ],
    owner: owners[0],
    targetStartDate: "2026-07-01",
    targetCompletionDate: "2026-10-31",
    notes: "Approved by network planning committee.",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(3),
  },
  {
    id: "prop-002",
    title: "Mohakhali Splitter 1:16 Upgrade",
    description:
      "Replace aging 1:8 splitter with 1:16 to relieve port exhaustion at Mohakhali junction.",
    type: "splitter_upgrade",
    status: "in_progress",
    targetArea: "Mohakhali",
    relatedAssetId: "jb-mohakhali-01",
    estimatedNewCustomers: 80,
    currentUtilizationPercent: 94,
    projectedUtilizationPercent: 58,
    estimatedBudgetUsd: 42000,
    budgetLineItems: [
      { category: "Splitter hardware", amountUsd: 12000 },
      { category: "Installation labor", amountUsd: 18000 },
      { category: "Testing & certification", amountUsd: 6000 },
      { category: "Contingency", amountUsd: 6000 },
    ],
    areas: [
      {
        type: "circle",
        center: { lat: 23.7789, lng: 90.3944 },
        radiusMeters: 400,
      },
    ],
    routes: [],
    owner: owners[1],
    targetStartDate: "2026-05-15",
    targetCompletionDate: "2026-06-30",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
  {
    id: "prop-003",
    title: "Tejgaon Secondary PoP",
    description:
      "Build a secondary PoP at Tejgaon to improve redundancy and reduce backhaul latency.",
    type: "pop_build",
    status: "review",
    targetArea: "Tejgaon Industrial",
    relatedAssetId: "jb-tejgaon-01",
    estimatedNewCustomers: 500,
    currentUtilizationPercent: 85,
    projectedUtilizationPercent: 45,
    estimatedBudgetUsd: 520000,
    budgetLineItems: [
      { category: "Site build-out", amountUsd: 280000 },
      { category: "Core routing equipment", amountUsd: 150000 },
      { category: "Backhaul fiber", amountUsd: 60000 },
      { category: "Power & cooling", amountUsd: 30000 },
    ],
    areas: [
      {
        type: "circle",
        center: { lat: 23.7644, lng: 90.3928 },
        radiusMeters: 1200,
      },
    ],
    routes: [
      {
        waypoints: [
          { lat: 23.8103, lng: 90.4125 },
          { lat: 23.7925, lng: 90.4078 },
          { lat: 23.7644, lng: 90.3928 },
        ],
      },
    ],
    owner: owners[2],
    targetStartDate: "2026-09-01",
    targetCompletionDate: "2027-03-31",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(2),
  },
  {
    id: "prop-004",
    title: "Banani Capacity Relief",
    description:
      "Add distribution capacity between Banani junction and Gulshan splitter cluster.",
    type: "capacity_upgrade",
    status: "draft",
    targetArea: "Banani",
    relatedAssetId: "jb-banani-01",
    estimatedNewCustomers: 120,
    currentUtilizationPercent: 88,
    projectedUtilizationPercent: 65,
    estimatedBudgetUsd: 68000,
    budgetLineItems: [
      { category: "Additional fiber spans", amountUsd: 35000 },
      { category: "Labor", amountUsd: 22000 },
      { category: "Materials", amountUsd: 11000 },
    ],
    areas: [],
    routes: [
      {
        waypoints: [
          { lat: 23.7937, lng: 90.4066 },
          { lat: 23.7945, lng: 90.4072 },
          { lat: 23.7935, lng: 90.4085 },
        ],
      },
    ],
    owner: owners[3],
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: "prop-005",
    title: "Dhanmondi New Market Entry",
    description:
      "Greenfield fiber deployment for a new residential market west of Gulshan.",
    type: "new_market",
    status: "draft",
    targetArea: "Dhanmondi West",
    estimatedNewCustomers: 350,
    projectedUtilizationPercent: 40,
    estimatedBudgetUsd: 310000,
    budgetLineItems: [
      { category: "Aerial fiber deployment", amountUsd: 180000 },
      { category: "Customer premise prep", amountUsd: 80000 },
      { category: "Marketing & pre-sales", amountUsd: 25000 },
      { category: "Project management", amountUsd: 25000 },
    ],
    areas: [
      {
        type: "polygon",
        coordinates: [
          { lat: 23.751, lng: 90.375 },
          { lat: 23.751, lng: 90.385 },
          { lat: 23.758, lng: 90.385 },
          { lat: 23.758, lng: 90.375 },
        ],
      },
    ],
    routes: [],
    owner: owners[0],
    targetStartDate: "2026-11-01",
    targetCompletionDate: "2027-06-30",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "prop-006",
    title: "Main Street Redundancy Ring",
    description:
      "Close the distribution ring along Main Street to eliminate single-point-of-failure.",
    type: "fiber_expansion",
    status: "completed",
    targetArea: "Main Street Corridor",
    relatedAssetId: "pole-main-st-01",
    estimatedNewCustomers: 0,
    currentUtilizationPercent: 72,
    projectedUtilizationPercent: 72,
    estimatedBudgetUsd: 95000,
    budgetLineItems: [
      { category: "Fiber ring closure", amountUsd: 55000 },
      { category: "Pole attachments", amountUsd: 25000 },
      { category: "Testing", amountUsd: 15000 },
    ],
    areas: [],
    routes: [
      {
        waypoints: [
          { lat: 23.796, lng: 90.41 },
          { lat: 23.7955, lng: 90.4095 },
          { lat: 23.795, lng: 90.409 },
        ],
      },
    ],
    owner: owners[1],
    targetStartDate: "2025-12-01",
    targetCompletionDate: "2026-02-28",
    notes: "Completed ahead of schedule.",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(60),
  },
];

let proposals: PlanningProposal[] = seedProposals.map((p) => ({ ...p }));

function nextProposalId(): string {
  const max = proposals.reduce((acc, p) => {
    const num = Number.parseInt(p.id.replace("prop-", ""), 10);
    return Number.isNaN(num) ? acc : Math.max(acc, num);
  }, 0);
  return `prop-${String(max + 1).padStart(3, "0")}`;
}

export function getPlanningProposals(): PlanningProposal[] {
  return proposals.map((p) => ({ ...p }));
}

export function getPlanningProposalById(
  id: string
): PlanningProposal | undefined {
  const proposal = proposals.find((p) => p.id === id);
  return proposal ? { ...proposal } : undefined;
}

export type CreatePlanningProposalInput = {
  title: string;
  description?: string;
  type: ProposalType;
  targetArea: string;
  relatedAssetId?: string;
  estimatedNewCustomers: number;
  currentUtilizationPercent?: number;
  projectedUtilizationPercent: number;
  estimatedBudgetUsd: number;
  budgetLineItems?: { category: string; amountUsd: number; notes?: string }[];
  owner: string;
  targetStartDate?: string;
  targetCompletionDate?: string;
  notes?: string;
};

export function createPlanningProposal(
  data: CreatePlanningProposalInput
): PlanningProposal {
  const now = new Date().toISOString();
  const proposal: PlanningProposal = {
    id: nextProposalId(),
    title: data.title,
    description: data.description,
    type: data.type,
    status: "draft",
    targetArea: data.targetArea,
    relatedAssetId: data.relatedAssetId,
    estimatedNewCustomers: data.estimatedNewCustomers,
    currentUtilizationPercent: data.currentUtilizationPercent,
    projectedUtilizationPercent: data.projectedUtilizationPercent,
    estimatedBudgetUsd: data.estimatedBudgetUsd,
    budgetLineItems: data.budgetLineItems ?? [],
    areas: [],
    routes: [],
    owner: data.owner,
    targetStartDate: data.targetStartDate,
    targetCompletionDate: data.targetCompletionDate,
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
  };
  proposals = [proposal, ...proposals];
  return { ...proposal };
}

export type UpdatePlanningProposalInput = Partial<
  Omit<PlanningProposal, "id" | "createdAt" | "updatedAt">
>;

export function updatePlanningProposal(
  id: string,
  patch: UpdatePlanningProposalInput
): PlanningProposal {
  const index = proposals.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error("Planning proposal not found");
  }

  const existing = proposals[index];
  const now = new Date().toISOString();
  const updated: PlanningProposal = {
    ...existing,
    ...patch,
    relatedAssetId: patch.relatedAssetId ?? existing.relatedAssetId,
    targetStartDate: patch.targetStartDate ?? existing.targetStartDate,
    targetCompletionDate: patch.targetCompletionDate ?? existing.targetCompletionDate,
    updatedAt: now,
  };

  proposals = [
    ...proposals.slice(0, index),
    updated,
    ...proposals.slice(index + 1),
  ];
  return { ...updated };
}

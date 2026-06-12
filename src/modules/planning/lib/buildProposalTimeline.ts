import type { PlanningProposal } from "@/types/domain";
import { statusLabels } from "@/modules/planning/schemas/proposal.schema";

export type ProposalTimelineEvent = {
  id: string;
  label: string;
  timestamp: string;
  actor?: string;
};

const statusOrder: PlanningProposal["status"][] = [
  "draft",
  "review",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
];

export function buildProposalTimeline(
  proposal: PlanningProposal
): ProposalTimelineEvent[] {
  const events: ProposalTimelineEvent[] = [
    {
      id: `${proposal.id}-created`,
      label: "Proposal created",
      timestamp: proposal.createdAt,
      actor: proposal.owner,
    },
  ];

  const currentIndex = statusOrder.indexOf(proposal.status);

  if (currentIndex >= 1) {
    events.push({
      id: `${proposal.id}-review`,
      label: statusLabels.review,
      timestamp: proposal.updatedAt,
      actor: proposal.owner,
    });
  }

  if (currentIndex >= 2 && proposal.status !== "cancelled") {
    events.push({
      id: `${proposal.id}-approved`,
      label: statusLabels.approved,
      timestamp: proposal.updatedAt,
      actor: proposal.owner,
    });
  }

  if (currentIndex >= 3 && proposal.status === "in_progress") {
    events.push({
      id: `${proposal.id}-in-progress`,
      label: statusLabels.in_progress,
      timestamp: proposal.updatedAt,
      actor: proposal.owner,
    });
  }

  if (proposal.status === "completed") {
    events.push({
      id: `${proposal.id}-completed`,
      label: statusLabels.completed,
      timestamp: proposal.updatedAt,
      actor: proposal.owner,
    });
  }

  if (proposal.status === "cancelled") {
    events.push({
      id: `${proposal.id}-cancelled`,
      label: statusLabels.cancelled,
      timestamp: proposal.updatedAt,
      actor: proposal.owner,
    });
  }

  return events;
}

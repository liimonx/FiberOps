"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Callout,
  Icon,
  Tabs,
  Textarea,
} from "@shohojdhara/atomix";
import type { Asset, PlanningProposal, ProposalStatus } from "@/types/domain";
import {
  formatRelativeTimeFromIso,
  mapProposalToTableRow,
} from "@/lib/operationsViewMappers";
import { buildProposalTimeline } from "@/modules/planning/lib/buildProposalTimeline";
import { computeCapacityContext } from "@/modules/planning/lib/computeCapacityContext";
import { getPlanningMapUrl } from "@/modules/planning/lib/planningMapNavigation";
import {
  statusLabels,
  typeLabels,
} from "@/modules/planning/schemas/proposal.schema";
import { useUpdatePlanningProposal } from "@/modules/planning/hooks/usePlanningProposalsData";
import { ProposalForecastChart } from "@/modules/planning/components/ProposalForecastChart";
import { ProposalBudgetTable } from "@/modules/planning/components/ProposalBudgetTable";

type ProposalDetailPanelProps = {
  proposal: PlanningProposal;
  relatedAsset: Asset | null;
  onClose: () => void;
};

function statusBadgeVariant(
  status: PlanningProposal["status"]
): "success" | "primary" | "warning" | "secondary" | "error" {
  switch (status) {
    case "approved":
    case "completed":
      return "success";
    case "review":
    case "in_progress":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "secondary";
  }
}

const nextStatusAction: Partial<
  Record<ProposalStatus, { label: string; next: ProposalStatus }>
> = {
  draft: { label: "Submit for Review", next: "review" },
  review: { label: "Approve", next: "approved" },
  approved: { label: "Start Build", next: "in_progress" },
  in_progress: { label: "Mark Complete", next: "completed" },
};

export function ProposalDetailPanel({
  proposal,
  relatedAsset,
  onClose,
}: ProposalDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [notes, setNotes] = useState(() => proposal.notes ?? "");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    mutateAsync: updateProposal,
    isPending: isSaving,
    isError: isSaveError,
    error: saveError,
  } = useUpdatePlanningProposal();

  const tableRow = mapProposalToTableRow(proposal);
  const timeline = buildProposalTimeline(proposal);
  const capacity = useMemo(
    () => computeCapacityContext(proposal, relatedAsset),
    [proposal, relatedAsset]
  );

  const statusAction = nextStatusAction[proposal.status];

  const handleStatusAdvance = async () => {
    if (!statusAction) return;
    setFeedback(null);
    await updateProposal({
      id: proposal.id,
      data: { status: statusAction.next },
    });
    setFeedback({
      type: "success",
      message: `Status updated to ${statusLabels[statusAction.next]}.`,
    });
  };

  const handleSaveNotes = async () => {
    setFeedback(null);
    await updateProposal({
      id: proposal.id,
      data: { notes },
    });
    setFeedback({ type: "success", message: "Notes saved." });
  };

  return (
    <div className="u-border-top u-border-secondary-subtle u-pt-6">
      <div className="u-flex u-justify-between u-items-start u-mb-4">
        <div>
          <div className="u-flex u-items-center u-gap-2 u-mb-2">
            <h3 className="u-text-base u-font-bold u-mb-0">{proposal.id}</h3>
            <span className="u-meta">
              Created {formatRelativeTimeFromIso(proposal.createdAt)}
            </span>
          </div>
          <p className="u-text-sm u-text-secondary-emphasis u-mb-3">
            {proposal.title}
          </p>
          <div className="u-flex u-gap-2 u-flex-wrap">
            <Badge variant={statusBadgeVariant(proposal.status)} label={tableRow.status} />
            <Badge variant="secondary" label={tableRow.type} />
            <Badge variant="secondary" label={proposal.owner} />
          </div>
        </div>
        <Button variant="secondary" size="sm" iconName="X" onClick={onClose} />
      </div>

      <Tabs activeIndex={activeTab} onTabChange={setActiveTab}>
        <Tabs.List className="u-mb-4">
          <Tabs.Trigger index={0}>Overview</Tabs.Trigger>
          <Tabs.Trigger index={1}>Forecast & Capacity</Tabs.Trigger>
          <Tabs.Trigger index={2}>Budget</Tabs.Trigger>
          <Tabs.Trigger index={3}>Map</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panels>
          <Tabs.Panel index={0}>
            <div className="u-incidents-timeline u-mb-4">
              {timeline.map((event) => (
                <div key={event.id} className="u-incidents-timeline-item">
                  <div className="u-font-bold u-text-sm">{event.label}</div>
                  <div className="u-text-secondary-emphasis u-text-xs">
                    {new Date(event.timestamp).toLocaleString()}
                    {event.actor ? ` • ${event.actor}` : ""}
                  </div>
                </div>
              ))}
            </div>

            <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle u-mb-4">
              <div className="u-incidents-asset-grid">
                <div className="u-incidents-asset-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Target area</span>
                  <span className="u-text-sm u-text-end">{proposal.targetArea}</span>
                </div>
                <div className="u-incidents-asset-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Type</span>
                  <span className="u-text-sm u-text-end">{typeLabels[proposal.type]}</span>
                </div>
                {relatedAsset && (
                  <div className="u-incidents-asset-row">
                    <span className="u-text-secondary-emphasis u-text-sm">Related asset</span>
                    <span className="u-font-mono u-text-sm u-text-end">{relatedAsset.name}</span>
                  </div>
                )}
                {proposal.targetStartDate && (
                  <div className="u-incidents-asset-row">
                    <span className="u-text-secondary-emphasis u-text-sm">Target start</span>
                    <span className="u-text-sm u-text-end">{proposal.targetStartDate}</span>
                  </div>
                )}
                {proposal.targetCompletionDate && (
                  <div className="u-incidents-asset-row">
                    <span className="u-text-secondary-emphasis u-text-sm">Target completion</span>
                    <span className="u-text-sm u-text-end">{proposal.targetCompletionDate}</span>
                  </div>
                )}
              </div>
            </div>

            {proposal.description && (
              <p className="u-text-sm u-text-secondary-emphasis u-mb-4">
                {proposal.description}
              </p>
            )}

            <div className="u-mb-4">
              <label className="u-form-label" htmlFor="proposal-detail-notes">
                Notes
              </label>
              <Textarea
                id="proposal-detail-notes"
                rows={3}
                fullWidth
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={isSaving}
              />
            </div>

            {(isSaveError || feedback) && (
              <Callout
                variant={feedback?.type === "success" || !isSaveError ? "success" : "error"}
                title={feedback?.type === "success" ? "Saved" : "Action failed"}
                className="u-mb-4"
              >
                <p className="u-text-sm u-mb-0">
                  {feedback?.message ??
                    (saveError instanceof Error ? saveError.message : "Please try again.")}
                </p>
              </Callout>
            )}

            <div className="u-flex u-justify-end u-gap-4 u-flex-wrap">
              {statusAction && (
                <Button
                  variant="primary"
                  onClick={handleStatusAdvance}
                  disabled={isSaving}
                >
                  {isSaving ? "Updating..." : statusAction.label}
                </Button>
              )}
              <Button
                variant="outline-secondary"
                onClick={handleSaveNotes}
                disabled={isSaving || notes === (proposal.notes ?? "")}
              >
                {isSaving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </Tabs.Panel>

          <Tabs.Panel index={1}>
            <ProposalForecastChart capacity={capacity} />
          </Tabs.Panel>

          <Tabs.Panel index={2}>
            <ProposalBudgetTable
              lineItems={proposal.budgetLineItems}
              totalUsd={proposal.estimatedBudgetUsd}
            />
          </Tabs.Panel>

          <Tabs.Panel index={3}>
            <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle u-mb-4">
              <div className="u-flex u-gap-4 u-mb-4">
                <div>
                  <div className="u-text-2xl u-font-bold">{proposal.areas.length}</div>
                  <div className="u-text-sm u-text-secondary-emphasis">Expansion areas</div>
                </div>
                <div>
                  <div className="u-text-2xl u-font-bold">{proposal.routes.length}</div>
                  <div className="u-text-sm u-text-secondary-emphasis">Proposed routes</div>
                </div>
              </div>

              {proposal.areas.length === 0 && proposal.routes.length === 0 ? (
                <div className="u-incidents-empty">
                  <Icon name="MapPin" size="lg" className="u-text-secondary-emphasis" />
                  <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                    No map geometry defined yet. Use Edit on Map to draw expansion areas and routes.
                  </p>
                </div>
              ) : (
                <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                  Geometry is ready to view on the Network Map.
                </p>
              )}
            </div>

            <div className="u-flex u-gap-3 u-flex-wrap">
              <Link href={getPlanningMapUrl(proposal.id)}>
                <Button variant="outline-secondary" iconName="MapTrifold">
                  View on Map
                </Button>
              </Link>
              <Link href={getPlanningMapUrl(proposal.id, { edit: true })}>
                <Button variant="primary" iconName="PencilSimple">
                  Edit on Map
                </Button>
              </Link>
            </div>
          </Tabs.Panel>
        </Tabs.Panels>
      </Tabs>
    </div>
  );
}

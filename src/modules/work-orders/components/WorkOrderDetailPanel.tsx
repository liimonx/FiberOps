"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Callout,
  Icon,
  Modal,
  Select,
  Tabs,
  Textarea,
} from "@shohojdhara/atomix";
import type { Asset, Incident, TeamMember, WorkOrder, WorkOrderStatus } from "@/types/domain";
import {
  formatCoordinates,
  formatRelativeTimeFromIso,
  mapWorkOrderToTableRow,
} from "@/lib/operationsViewMappers";
import { buildWorkOrderTimeline } from "@/modules/work-orders/lib/buildWorkOrderTimeline";
import {
  priorityLabels,
  statusLabels,
  workTypeLabels,
} from "@/modules/work-orders/schemas/workOrder.schema";
import { useUpdateWorkOrder } from "@/modules/work-orders/hooks/useWorkOrdersData";

type WorkOrderDetailPanelProps = {
  open: boolean;
  order: WorkOrder | null;
  relatedIncident: Incident | null;
  relatedAsset: Asset | null;
  teamMembers: TeamMember[];
  onClose: () => void;
};

const nextStatusAction: Partial<
  Record<WorkOrderStatus, { label: string; next: WorkOrderStatus }>
> = {
  new: { label: "Assign", next: "assigned" },
  assigned: { label: "Start Work", next: "in_progress" },
  in_progress: { label: "Submit for Review", next: "review" },
  review: { label: "Mark Done", next: "done" },
};

function priorityBadgeVariant(
  priority: WorkOrder["priority"]
): "error" | "warning" | "success" | "secondary" {
  if (priority === "critical") return "error";
  if (priority === "high") return "warning";
  if (priority === "medium") return "success";
  return "secondary";
}

function statusBadgeVariant(
  status: WorkOrderStatus
): "success" | "primary" | "warning" | "secondary" {
  if (status === "done") return "success";
  if (status === "in_progress") return "primary";
  if (status === "review") return "warning";
  return "secondary";
}

export function WorkOrderDetailPanel({
  open,
  order,
  relatedIncident,
  relatedAsset,
  teamMembers,
  onClose,
}: WorkOrderDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [notes, setNotes] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    mutateAsync: updateWorkOrder,
    isPending: isSaving,
    isError: isSaveError,
    error: saveError,
  } = useUpdateWorkOrder();

  useEffect(() => {
    if (!order || !open) return;
    setActiveTab(0);
    setNotes(order.notes ?? "");
    setAssigneeId(order.assigneeId ?? "");
    setFeedback(null);
  }, [order, open]);

  const assigneeName = useMemo(() => {
    if (!order?.assigneeId) return undefined;
    return teamMembers.find((member) => member.id === order.assigneeId)?.name;
  }, [order?.assigneeId, teamMembers]);

  if (!order) return null;

  const tableRow = mapWorkOrderToTableRow(order, assigneeName);
  const timeline = buildWorkOrderTimeline(order, assigneeName);
  const statusAction = nextStatusAction[order.status];
  const isDone = order.status === "done";

  const handleStatusAdvance = async () => {
    if (!statusAction) return;
    setFeedback(null);
    await updateWorkOrder({
      id: order.id,
      data: { status: statusAction.next },
    });
    setFeedback({
      type: "success",
      message: `Status updated to ${statusLabels[statusAction.next]}.`,
    });
  };

  const handleSaveNotes = async () => {
    setFeedback(null);
    await updateWorkOrder({
      id: order.id,
      data: { notes },
    });
    setFeedback({ type: "success", message: "Notes saved." });
  };

  const handleAssigneeChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setAssigneeId(value);
    setFeedback(null);
    await updateWorkOrder({
      id: order.id,
      data: {
        assigneeId: value || null,
        status: value && order.status === "new" ? "assigned" : undefined,
      },
    });
    setFeedback({ type: "success", message: "Assignee updated." });
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={order.id}
      subtitle={`Created ${formatRelativeTimeFromIso(order.createdAt)}`}
      size="lg"
      closeButton
      backdrop
      keyboard
      footer={
        <div className="u-flex u-justify-end u-gap-3 u-w-100">
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            Close
          </Button>
          {!isDone && statusAction && (
            <Button
              variant="primary"
              type="button"
              onClick={handleStatusAdvance}
              disabled={isSaving}
            >
              {isSaving ? "Updating..." : statusAction.label}
            </Button>
          )}
        </div>
      }
    >
      <div className="u-flex u-flex-column u-gap-4">
        <div>
          <p className="u-text-base u-font-bold u-mb-3">{order.title}</p>
          <div className="u-flex u-gap-2 u-flex-wrap">
            <Badge
              variant={priorityBadgeVariant(order.priority)}
              label={priorityLabels[order.priority]}
            />
            <Badge
              variant={statusBadgeVariant(order.status)}
              label={tableRow.status}
            />
            <Badge variant="secondary" label={workTypeLabels[order.workType]} />
            {assigneeName && (
              <Badge variant="secondary" label={assigneeName} />
            )}
          </div>
        </div>

        {feedback && activeTab !== 2 && (
          <Callout
            variant={feedback.type === "success" ? "success" : "error"}
            title={feedback.type === "success" ? "Saved" : "Error"}
          >
            <p className="u-text-sm u-mb-0">{feedback.message}</p>
          </Callout>
        )}

        <Tabs activeIndex={activeTab} onTabChange={setActiveTab}>
          <Tabs.List className="u-mb-4">
            <Tabs.Trigger index={0}>Overview</Tabs.Trigger>
            <Tabs.Trigger index={1}>Timeline</Tabs.Trigger>
            <Tabs.Trigger index={2}>Notes</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panels>
            <Tabs.Panel index={0}>
              <div className="u-flex u-flex-column u-gap-4">
                <div className="u-form-field">
                  <label className="u-form-label" htmlFor="work-order-detail-assignee">
                    Assignee
                  </label>
                  <Select
                    id="work-order-detail-assignee"
                    value={assigneeId}
                    onChange={handleAssigneeChange}
                    disabled={isDone || isSaving}
                    options={[
                      { label: "Unassigned", value: "" },
                      ...teamMembers.map((member) => ({
                        label: member.name,
                        value: member.id,
                      })),
                    ]}
                  />
                </div>

                {relatedIncident ? (
                  <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle">
                    <div className="u-flex u-justify-between u-items-center u-mb-2">
                      <span className="u-text-sm u-font-bold">Related incident</span>
                      <Link
                        href={`/incidents?selected=${relatedIncident.id}`}
                        className="u-text-sm u-text-primary"
                      >
                        View incident
                      </Link>
                    </div>
                    <p className="u-text-sm u-mb-1">{relatedIncident.title}</p>
                    <span className="u-font-mono u-text-xs u-text-secondary-emphasis">
                      {relatedIncident.id}
                    </span>
                  </div>
                ) : (
                  <div className="u-empty-state-panel">
                    <Icon name="Warning" size="lg" className="u-text-secondary-emphasis" />
                    <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                      No related incident linked.
                    </p>
                  </div>
                )}

                {relatedAsset ? (
                  <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle">
                    <div className="u-flex u-justify-between u-items-center u-mb-2">
                      <span className="u-text-sm u-font-bold">Related asset</span>
                      <Link
                        href={`/network-map?node=${relatedAsset.id}`}
                        className="u-text-sm u-text-primary"
                      >
                        View on map
                      </Link>
                    </div>
                    <div className="u-detail-grid">
                      <div className="u-detail-row">
                        <span className="u-text-secondary-emphasis u-text-sm">Asset ID</span>
                        <span className="u-font-mono u-text-sm">{relatedAsset.id}</span>
                      </div>
                      <div className="u-detail-row">
                        <span className="u-text-secondary-emphasis u-text-sm">Name</span>
                        <span className="u-text-sm u-text-end">{relatedAsset.name}</span>
                      </div>
                      <div className="u-detail-row">
                        <span className="u-text-secondary-emphasis u-text-sm">Coordinates</span>
                        <span className="u-font-mono u-text-sm u-text-end">
                          {formatCoordinates(relatedAsset.location)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="u-empty-state-panel">
                    <Icon name="HardDrive" size="lg" className="u-text-secondary-emphasis" />
                    <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                      No related asset linked.
                    </p>
                  </div>
                )}
              </div>
            </Tabs.Panel>

            <Tabs.Panel index={1}>
              <div className="u-timeline">
                {timeline.map((event) => (
                  <div key={event.id} className="u-timeline__item">
                    <div className="u-font-bold u-text-sm">{event.label}</div>
                    <div className="u-text-secondary-emphasis u-text-xs">
                      {new Date(event.timestamp).toLocaleString()}
                      {event.actor ? ` • ${event.actor}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.Panel>

            <Tabs.Panel index={2}>
              <p className="u-text-sm u-text-secondary-emphasis u-mb-3">
                Field notes and completion details for this work order.
              </p>
              <div className="u-mb-4">
                <Textarea
                  placeholder="Enter field notes..."
                  rows={4}
                  fullWidth
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={isDone || isSaving}
                />
              </div>

              {isSaveError && (
                <Callout variant="error" title="Action failed" className="u-mb-4">
                  <p className="u-text-sm u-mb-0">
                    {saveError instanceof Error ? saveError.message : "Please try again."}
                  </p>
                </Callout>
              )}

              {feedback && (
                <Callout
                  variant={feedback.type === "success" ? "success" : "error"}
                  title={feedback.type === "success" ? "Saved" : "Error"}
                  className="u-mb-4"
                >
                  <p className="u-text-sm u-mb-0">{feedback.message}</p>
                </Callout>
              )}

              <div className="u-flex u-justify-end">
                <Button
                  variant="primary"
                  onClick={handleSaveNotes}
                  disabled={isDone || isSaving || notes.length === 0}
                >
                  {isSaving ? "Saving..." : "Save Notes"}
                </Button>
              </div>
            </Tabs.Panel>
          </Tabs.Panels>
        </Tabs>
      </div>
    </Modal>
  );
}

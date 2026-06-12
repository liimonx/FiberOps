"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Icon,
  Modal,
  Tabs,
  Textarea,
} from "@shohojdhara/atomix";
import type { Asset, Incident } from "@/types/domain";
import {
  mapIncidentToTableRow,
  formatCoordinates,
  formatRelativeTimeFromIso,
} from "@/lib/operationsViewMappers";
import { buildIncidentTimeline } from "@/modules/incidents/lib/buildIncidentTimeline";
import {
  useResolveIncident,
  useUpdateIncident,
} from "@/modules/incidents/hooks/useIncidentsData";

type IncidentDetailPanelProps = {
  open: boolean;
  incident: Incident | null;
  relatedAsset: Asset | null;
  onClose: () => void;
};

export function IncidentDetailPanel({
  open,
  incident,
  relatedAsset,
  onClose,
}: IncidentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    mutateAsync: updateIncident,
    isPending: isSaving,
    isError: isSaveError,
    error: saveError,
  } = useUpdateIncident();

  const {
    mutateAsync: resolveIncident,
    isPending: isResolving,
    isError: isResolveError,
    error: resolveError,
  } = useResolveIncident();

  useEffect(() => {
    if (!incident || !open) return;
    setActiveTab(0);
    setNotes(incident.notes ?? "");
    setFeedback(null);
  }, [incident, open]);

  if (!incident) return null;

  const tableRow = mapIncidentToTableRow(incident);
  const timeline = buildIncidentTimeline(incident);
  const isResolved = incident.status === "resolved";

  const handleSaveDraft = async () => {
    setFeedback(null);
    await updateIncident({ id: incident.id, data: { notes } });
    setFeedback({ type: "success", message: "Draft notes saved." });
  };

  const handleResolve = async () => {
    setFeedback(null);
    await resolveIncident({
      id: incident.id,
      data: { resolutionNotes: notes },
    });
    setFeedback({ type: "success", message: "Incident resolved successfully." });
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={incident.id}
      subtitle={`Reported ${formatRelativeTimeFromIso(incident.createdAt)}`}
      size="lg"
      closeButton
      backdrop
      keyboard
      footer={
        <div className="u-flex u-justify-end u-gap-3 u-w-100">
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="u-flex u-flex-column u-gap-4">
        <div>
          <p className="u-text-base u-font-bold u-mb-3">{incident.title}</p>
          <div className="u-flex u-gap-2 u-flex-wrap">
            <Badge
              variant={
                tableRow.severity === "Critical"
                  ? "error"
                  : tableRow.severity === "Warning"
                    ? "warning"
                    : "secondary"
              }
              label={tableRow.severity}
            />
            <Badge
              variant={
                tableRow.status === "Resolved"
                  ? "success"
                  : tableRow.status === "Investigating" || tableRow.status === "In Progress"
                    ? "warning"
                    : "primary"
              }
              label={tableRow.status}
            />
            {incident.technician && (
              <Badge variant="secondary" label={incident.technician} />
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
            <Tabs.Trigger index={0}>Timeline</Tabs.Trigger>
            <Tabs.Trigger index={1}>Asset</Tabs.Trigger>
            <Tabs.Trigger index={2}>Resolution</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Panels>
            <Tabs.Panel index={0}>
              <div className="u-incidents-timeline">
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
            </Tabs.Panel>

            <Tabs.Panel index={1}>
              {relatedAsset ? (
                <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle">
                  <div className="u-incidents-asset-grid">
                    <div className="u-incidents-asset-row">
                      <span className="u-text-secondary-emphasis u-text-sm">Asset ID</span>
                      <span className="u-font-mono u-text-sm">{relatedAsset.id}</span>
                    </div>
                    <div className="u-incidents-asset-row">
                      <span className="u-text-secondary-emphasis u-text-sm">Name</span>
                      <span className="u-text-sm u-text-end">{relatedAsset.name}</span>
                    </div>
                    <div className="u-incidents-asset-row">
                      <span className="u-text-secondary-emphasis u-text-sm">Coordinates</span>
                      <span className="u-font-mono u-text-sm u-text-end">
                        {formatCoordinates(relatedAsset.location)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="u-incidents-empty">
                  <Icon name="HardDrive" size="lg" className="u-text-secondary-emphasis" />
                  <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                    No related asset linked to this incident.
                  </p>
                </div>
              )}
            </Tabs.Panel>

            <Tabs.Panel index={2}>
              <p className="u-text-sm u-text-secondary-emphasis u-mb-3">
                Document investigation steps or final resolution notes for this ticket.
              </p>
              <div className="u-mb-4">
                <Textarea
                  placeholder="Enter detailed resolution steps or current investigation notes..."
                  rows={4}
                  fullWidth
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  disabled={isResolved || isSaving || isResolving}
                />
              </div>

              {(isSaveError || isResolveError) && (
                <Callout variant="error" title="Action failed" className="u-mb-4">
                  <p className="u-text-sm u-mb-0">
                    {(saveError ?? resolveError) instanceof Error
                      ? (saveError ?? resolveError)?.message
                      : "Please try again."}
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

              <div className="u-flex u-justify-end u-gap-4">
                <Button
                  variant="outline-secondary"
                  onClick={handleSaveDraft}
                  disabled={isResolved || isSaving || isResolving || notes.length === 0}
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleResolve}
                  disabled={
                    isResolved || isSaving || isResolving || notes.trim().length < 10
                  }
                >
                  {isResolving ? "Resolving..." : "Submit & Resolve"}
                </Button>
              </div>
            </Tabs.Panel>
          </Tabs.Panels>
        </Tabs>
      </div>
    </Modal>
  );
}

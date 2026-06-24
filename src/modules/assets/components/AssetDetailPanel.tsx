"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Callout,
  Icon,
  Select,
  Tabs,
} from "@shohojdhara/atomix";
import type { Asset, AssetStatus, Incident } from "@/types/domain";
import {
  formatCoordinates,
  mapAssetToTableRow,
  mapIncidentToTableRow,
} from "@/lib/operationsViewMappers";
import { getAssetMapUrl } from "@/modules/assets/lib/assetMapNavigation";
import { buildAssetMaintenanceTimeline } from "@/modules/assets/lib/buildAssetMaintenanceTimeline";
import { getAssetKindIcon } from "@/modules/assets/lib/assetKindIcons";
import {
  assetKindLabels,
  assetStatusLabels,
} from "@/modules/assets/schemas/asset.schema";
import {
  useNodeDetails,
  useUpdateAssetStatus,
} from "@/modules/network-map/hooks/useNetworkData";

type AssetDetailPanelProps = {
  asset: Asset;
  relatedIncidents: Incident[];
  onClose: () => void;
  layout?: "below" | "sidebar";
};

function assetStatusBadgeVariant(
  status: AssetStatus
): "success" | "warning" | "error" | "secondary" {
  switch (status) {
    case "active":
      return "success";
    case "degraded":
    case "maintenance":
      return "warning";
    case "down":
      return "error";
  }
}

export function AssetDetailPanel({
  asset,
  relatedIncidents,
  onClose,
  layout = "sidebar",
}: AssetDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState(asset.status);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { mutateAsync: updateStatus, isPending: isSaving } = useUpdateAssetStatus();
  const { connections } = useNodeDetails(asset.id);

  const tableRow = mapAssetToTableRow(asset);
  const maintenanceEvents = buildAssetMaintenanceTimeline(asset);
  const kindIcon = getAssetKindIcon(asset.kind);

  useEffect(() => {
    setActiveTab(0);
    setStatus(asset.status);
    setFeedback(null);
  }, [asset.id, asset.status]);

  const connectedNodeIds = connections.flatMap((connection) => {
    const peerId =
      connection.sourceNodeId === asset.id
        ? connection.targetNodeId
        : connection.sourceNodeId;
    return peerId !== asset.id ? [peerId] : [];
  });

  const handleSaveStatus = async () => {
    setFeedback(null);
    await updateStatus({ assetId: asset.id, status });
    setFeedback({ type: "success", message: "Asset status updated." });
  };

  return (
    <div
      className={
        layout === "sidebar"
          ? "u-profile-panel"
          : "u-border-top u-border-secondary-subtle u-pt-6"
      }
    >
      <div className="u-flex u-justify-between u-items-start u-mb-4">
        <div>
          <div className="u-flex u-items-center u-gap-2 u-mb-2">
            <Icon name={kindIcon} size="sm" className="u-text-secondary-emphasis" />
            <h3 className="u-text-base u-font-bold u-mb-0">{asset.name}</h3>
            <span className="u-meta">{asset.id}</span>
          </div>
          <p className="u-text-sm u-text-secondary-emphasis u-mb-3">
            {assetKindLabels[asset.kind]} • {formatCoordinates(asset.location)}
          </p>
          <div className="u-flex u-gap-2 u-flex-wrap">
            <Badge
              variant={assetStatusBadgeVariant(asset.status)}
              label={assetStatusLabels[asset.status]}
            />
            <Badge variant="secondary" label={tableRow.type} />
            {relatedIncidents.length > 0 && (
              <Badge
                variant="error"
                label={`${relatedIncidents.length} open incident${
                  relatedIncidents.length === 1 ? "" : "s"
                }`}
              />
            )}
          </div>
        </div>
        <Button variant="secondary" size="sm" iconName="X" onClick={onClose} />
      </div>

      <Tabs activeIndex={activeTab} onTabChange={setActiveTab}>
        <Tabs.List className="u-mb-4">
          <Tabs.Trigger index={0}>Overview</Tabs.Trigger>
          <Tabs.Trigger index={1}>Maintenance</Tabs.Trigger>
          <Tabs.Trigger index={2}>
            Connections ({connectedNodeIds.length})
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panels>
          <Tabs.Panel index={0}>
            <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle">
              <div className="u-detail-grid">
                <div className="u-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Asset ID</span>
                  <span className="u-font-mono u-text-sm u-text-end">{asset.id}</span>
                </div>
                <div className="u-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Type</span>
                  <span className="u-text-sm u-text-end">
                    {assetKindLabels[asset.kind]}
                  </span>
                </div>
                <div className="u-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Location</span>
                  <span className="u-text-sm u-text-end">{asset.name}</span>
                </div>
                <div className="u-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Coordinates</span>
                  <span className="u-font-mono u-text-sm u-text-end">
                    {tableRow.coordinates}
                  </span>
                </div>
                <div className="u-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">
                    Last Maintenance
                  </span>
                  <span className="u-font-mono u-text-sm u-text-end">
                    {tableRow.lastMaintenance}
                  </span>
                </div>
              </div>
            </div>

            <div className="u-form-field u-mt-4">
              <label className="u-form-label" htmlFor="asset-status">
                Operational Status
              </label>
              <Select
                id="asset-status"
                value={status}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setStatus(event.target.value as AssetStatus)
                }
                options={Object.entries(assetStatusLabels).map(([value, label]) => ({
                  label,
                  value,
                }))}
              />
            </div>

            {feedback && (
              <Callout
                variant={feedback.type === "success" ? "success" : "error"}
                title={feedback.type === "success" ? "Saved" : "Error"}
                className="u-mt-4"
              >
                <p className="u-text-sm u-mb-0">{feedback.message}</p>
              </Callout>
            )}

            <div className="u-flex u-flex-wrap u-gap-2 u-justify-end u-mt-4">
              <Link href={getAssetMapUrl(asset.id)}>
                <Button variant="outline-secondary" iconName="MapTrifold">
                  View on Map
                </Button>
              </Link>
              <Button
                variant="primary"
                onClick={handleSaveStatus}
                disabled={isSaving || status === asset.status}
              >
                {isSaving ? "Saving..." : "Save Status"}
              </Button>
            </div>
          </Tabs.Panel>

          <Tabs.Panel index={1}>
            <div className="u-timeline">
              {maintenanceEvents.map((event) => (
                <div key={event.id} className="u-timeline__item">
                  <div className="u-font-bold u-text-sm">{event.label}</div>
                  <div className="u-text-secondary-emphasis u-text-xs u-mb-1">
                    {event.date}
                  </div>
                  <p className="u-text-sm u-mb-0">{event.description}</p>
                </div>
              ))}
            </div>
          </Tabs.Panel>

          <Tabs.Panel index={2}>
            {connectedNodeIds.length > 0 ? (
              <div className="u-flex u-flex-column u-gap-2 u-mb-4">
                {connectedNodeIds.slice(0, 8).map((nodeId) => (
                  <div
                    key={nodeId}
                    className="u-flex u-justify-between u-items-center u-p-3 u-bg-dark u-rounded u-border u-border-secondary-subtle"
                  >
                    <span className="u-font-mono u-text-sm">{nodeId}</span>
                    <Link href={getAssetMapUrl(nodeId)}>
                      <Button variant="outline-secondary" size="sm">
                        Trace
                      </Button>
                    </Link>
                  </div>
                ))}
                {connectedNodeIds.length > 8 && (
                  <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
                    +{connectedNodeIds.length - 8} more connections on the network map
                  </p>
                )}
              </div>
            ) : (
              <p className="u-text-sm u-text-secondary-emphasis u-mb-4">
                No direct topology links found for this asset.
              </p>
            )}

            {relatedIncidents.length > 0 && (
              <>
                <h4 className="u-text-sm u-font-bold u-mb-2">Related Incidents</h4>
                <div className="u-flex u-flex-column u-gap-2">
                  {relatedIncidents.map((incident) => {
                    const row = mapIncidentToTableRow(incident);
                    return (
                      <div
                        key={incident.id}
                        className="u-p-3 u-bg-dark u-rounded u-border u-border-secondary-subtle"
                      >
                        <div className="u-flex u-justify-between u-items-start u-gap-2">
                          <span className="u-font-bold u-text-sm">{row.title}</span>
                          <Badge variant="error" label={row.severity} />
                        </div>
                        <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
                          {incident.id} • {row.status}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="u-flex u-justify-end u-mt-4">
              <Link href={getAssetMapUrl(asset.id)}>
                <Button variant="outline-secondary" iconName="MapTrifold">
                  Open Network Map
                </Button>
              </Link>
            </div>
          </Tabs.Panel>
        </Tabs.Panels>
      </Tabs>
    </div>
  );
}

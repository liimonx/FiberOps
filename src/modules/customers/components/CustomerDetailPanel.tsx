"use client";

import { useState, type ChangeEvent } from "react";
import {
  Badge,
  Button,
  Callout,
  Icon,
  Select,
  Tabs,
} from "@shohojdhara/atomix";
import type { Asset, Customer, Incident } from "@/types/domain";
import {
  formatCoordinates,
  formatRelativeTimeFromIso,
  mapCustomerToTableRow,
  mapIncidentToTableRow,
} from "@/lib/operationsViewMappers";
import { buildCustomerConnectionPath } from "@/modules/customers/lib/buildCustomerConnectionPath";
import {
  billingLabels,
  statusLabels,
} from "@/modules/customers/schemas/customer.schema";
import { useUpdateCustomer } from "@/modules/customers/hooks/useCustomersData";

type CustomerDetailPanelProps = {
  customer: Customer;
  relatedOnu: Asset | null;
  relatedIncidents: Incident[];
  assets: Asset[];
  onClose: () => void;
  layout?: "below" | "sidebar";
};

export function CustomerDetailPanel({
  customer,
  relatedOnu,
  relatedIncidents,
  assets,
  onClose,
  layout = "below",
}: CustomerDetailPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState(customer.status);
  const [billingStatus, setBillingStatus] = useState(customer.billingStatus);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    mutateAsync: updateCustomer,
    isPending: isSaving,
    isError: isSaveError,
    error: saveError,
  } = useUpdateCustomer();

  const connectionPath = buildCustomerConnectionPath(customer, assets);
  const tableRow = mapCustomerToTableRow(customer, {
    connectionPath,
    relatedOnu,
    incidentHistory: relatedIncidents.length,
  });

  const handleSave = async () => {
    setFeedback(null);
    await updateCustomer({
      id: customer.id,
      data: { status, billingStatus },
    });
    setFeedback({ type: "success", message: "Customer profile updated." });
  };

  return (
    <div
      className={
        layout === "sidebar"
          ? "u-customers-profile-panel"
          : "u-border-top u-border-secondary-subtle u-pt-6"
      }
    >
      <div className="u-flex u-justify-between u-items-start u-mb-4">
        <div>
          <div className="u-flex u-items-center u-gap-2 u-mb-2">
            <h3 className="u-text-base u-font-bold u-mb-0">{customer.name}</h3>
            <span className="u-meta">{customer.id}</span>
          </div>
          <p className="u-text-sm u-text-secondary-emphasis u-mb-3">
            {customer.plan} • Customer since{" "}
            {formatRelativeTimeFromIso(customer.createdAt)}
          </p>
          <div className="u-flex u-gap-2 u-flex-wrap">
            <Badge
              variant={
                status === "online"
                  ? "success"
                  : status === "unstable"
                    ? "warning"
                    : "error"
              }
              label={statusLabels[status]}
            />
            <Badge
              variant={
                billingStatus === "paid"
                  ? "success"
                  : billingStatus === "overdue"
                    ? "error"
                    : "warning"
              }
              label={billingLabels[billingStatus]}
            />
            <Badge variant="secondary" label={`${tableRow.signalHealth}% signal`} />
          </div>
        </div>
        <Button variant="secondary" size="sm" iconName="X" onClick={onClose} />
      </div>

      <Tabs activeIndex={activeTab} onTabChange={setActiveTab}>
        <Tabs.List className="u-mb-4">
          <Tabs.Trigger index={0}>Overview</Tabs.Trigger>
          <Tabs.Trigger index={1}>Connection</Tabs.Trigger>
          <Tabs.Trigger index={2}>
            Incidents ({relatedIncidents.length})
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panels>
          <Tabs.Panel index={0}>
            <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle">
              <div className="u-customers-detail-grid">
                <div className="u-customers-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Email</span>
                  <span className="u-text-sm u-text-end">
                    {customer.email ?? "—"}
                  </span>
                </div>
                <div className="u-customers-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Plan</span>
                  <span className="u-text-sm u-text-end">{customer.plan}</span>
                </div>
                <div className="u-customers-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Type</span>
                  <span className="u-text-sm u-text-end">{tableRow.type}</span>
                </div>
                <div className="u-customers-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Location</span>
                  <span className="u-font-mono u-text-sm u-text-end">
                    {customer.location
                      ? formatCoordinates(customer.location)
                      : "—"}
                  </span>
                </div>
                <div className="u-customers-detail-row">
                  <span className="u-text-secondary-emphasis u-text-sm">Last Updated</span>
                  <span className="u-text-sm u-text-end">
                    {formatRelativeTimeFromIso(customer.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="u-customers-edit-fields u-mt-4">
              <div className="u-customers-form-field">
                <label className="u-form-label" htmlFor="customer-status">
                  Service Status
                </label>
                <Select
                  id="customer-status"
                  value={status}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setStatus(event.target.value as Customer["status"])
                  }
                  options={[
                    { label: statusLabels.online, value: "online" },
                    { label: statusLabels.unstable, value: "unstable" },
                    { label: statusLabels.offline, value: "offline" },
                  ]}
                />
              </div>
              <div className="u-customers-form-field">
                <label className="u-form-label" htmlFor="customer-billing">
                  Billing Status
                </label>
                <Select
                  id="customer-billing"
                  value={billingStatus}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setBillingStatus(event.target.value as Customer["billingStatus"])
                  }
                  options={[
                    { label: billingLabels.paid, value: "paid" },
                    { label: billingLabels.overdue, value: "overdue" },
                    { label: billingLabels.unpaid, value: "unpaid" },
                  ]}
                />
              </div>
            </div>

            {(isSaveError) && (
              <Callout variant="error" title="Update failed" className="u-mt-4">
                <p className="u-text-sm u-mb-0">
                  {saveError instanceof Error ? saveError.message : "Please try again."}
                </p>
              </Callout>
            )}

            {feedback && (
              <Callout
                variant={feedback.type === "success" ? "success" : "error"}
                title={feedback.type === "success" ? "Saved" : "Error"}
                className="u-mt-4"
              >
                <p className="u-text-sm u-mb-0">{feedback.message}</p>
              </Callout>
            )}

            <div className="u-flex u-justify-end u-mt-4">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={
                  isSaving ||
                  (status === customer.status &&
                    billingStatus === customer.billingStatus)
                }
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Tabs.Panel>

          <Tabs.Panel index={1}>
            <p className="u-text-sm u-text-secondary-emphasis u-mb-3 u-font-mono">
              {connectionPath}
            </p>
            {relatedOnu ? (
              <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle">
                <div className="u-customers-detail-grid">
                  <div className="u-customers-detail-row">
                    <span className="u-text-secondary-emphasis u-text-sm">ONU ID</span>
                    <span className="u-font-mono u-text-sm">{relatedOnu.id}</span>
                  </div>
                  <div className="u-customers-detail-row">
                    <span className="u-text-secondary-emphasis u-text-sm">Name</span>
                    <span className="u-text-sm u-text-end">{relatedOnu.name}</span>
                  </div>
                  <div className="u-customers-detail-row">
                    <span className="u-text-secondary-emphasis u-text-sm">Status</span>
                    <Badge
                      variant={
                        relatedOnu.status === "active"
                          ? "success"
                          : relatedOnu.status === "down"
                            ? "error"
                            : "warning"
                      }
                      label={relatedOnu.status}
                    />
                  </div>
                  <div className="u-customers-detail-row">
                    <span className="u-text-secondary-emphasis u-text-sm">Coordinates</span>
                    <span className="u-font-mono u-text-sm u-text-end">
                      {formatCoordinates(relatedOnu.location)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="u-customers-empty">
                <Icon name="HardDrive" size="lg" className="u-text-secondary-emphasis" />
                <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                  No ONU linked to this customer.
                </p>
              </div>
            )}
          </Tabs.Panel>

          <Tabs.Panel index={2}>
            {relatedIncidents.length > 0 ? (
              <div className="u-flex u-flex-column u-gap-3">
                {relatedIncidents.map((incident) => {
                  const row = mapIncidentToTableRow(incident);
                  return (
                    <div
                      key={incident.id}
                      className="u-p-3 u-rounded u-border u-border-secondary-subtle u-bg-dark"
                    >
                      <div className="u-flex u-items-center u-gap-2 u-mb-1">
                        <span className="u-font-mono u-text-sm">{incident.id}</span>
                        <Badge
                          variant={
                            row.severity === "Critical"
                              ? "error"
                              : row.severity === "Warning"
                                ? "warning"
                                : "secondary"
                          }
                          label={row.severity}
                        />
                        <Badge variant="secondary" label={row.status} />
                      </div>
                      <p className="u-text-sm u-mb-0">{incident.title}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="u-customers-empty">
                <Icon name="ClipboardText" size="lg" className="u-text-secondary-emphasis" />
                <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                  No incidents linked to this customer&apos;s ONU.
                </p>
              </div>
            )}
          </Tabs.Panel>
        </Tabs.Panels>
      </Tabs>
    </div>
  );
}

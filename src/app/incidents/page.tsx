"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  Card,
  Container,
  Grid,
  GridCol,
  Badge,
  Button,
  Callout,
  Icon,
  DataTable,
  DataTableColumn,
  Select,
  Textarea,
} from "@shohojdhara/atomix";
import { useIncidents } from "@/modules/network-map/hooks/useNetworkData";
import { mapIncidentToTableRow } from "@/lib/operationsViewMappers";

type SeverityFilter = "All" | "Critical" | "Warning" | "Low";

export default function IncidentsPage() {
  const { data: incidents, isLoading, isError, refetch } = useIncidents();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("All");

  const tableRows = useMemo(
    () => (incidents ?? []).map(mapIncidentToTableRow),
    [incidents]
  );

  const filteredIncidents =
    severityFilter === "All"
      ? tableRows
      : tableRows.filter((incident) => incident.severity === severityFilter);

  const columns: DataTableColumn[] = [
    {
      key: "id",
      title: "Ticket ID",
      render: (val) => <span className="u-font-mono u-text-sm">{val}</span>,
    },
    {
      key: "title",
      title: "Issue Description",
      render: (val) => <span className="u-font-bold">{val}</span>,
    },
    {
      key: "severity",
      title: "Severity",
      render: (val) => {
        let variant: "error" | "warning" | "secondary" = "secondary";
        if (val === "Critical") variant = "error";
        if (val === "Warning") variant = "warning";
        return <Badge variant={variant} label={val} />;
      },
    },
    {
      key: "status",
      title: "Status",
      render: (val) => {
        let variant: "success" | "primary" | "warning" = "primary";
        if (val === "Resolved") variant = "success";
        if (val === "Investigating" || val === "In Progress") variant = "warning";
        return <Badge variant={variant} label={val} />;
      },
    },
    { key: "technician", title: "Technician" },
    {
      key: "time",
      title: "Reported",
      render: (val) => <span className="u-text-secondary-emphasis u-text-sm">{val}</span>,
    },
    {
      key: "actions",
      title: "",
      render: () => <Button variant="secondary" size="sm" iconName="ArrowRight" />,
    },
  ];

  if (isLoading) {
    return (
      <Container className="u-page" aria-busy="true">
        <div className="u-skeleton u-h-10 u-mb-6" style={{ width: "14rem" }} />
        <div className="u-skeleton u-h-64" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="u-page">
        <Callout variant="error" title="Failed to load incidents">
          <p className="u-text-sm u-mb-3">
            The incident log could not be loaded. Please try again.
          </p>
          <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Callout>
      </Container>
    );
  }

  return (
    <Container className="u-page">
      <div className="u-page-header">
        <div>
          <h1 className="u-page-title">Incident Management</h1>
          <p className="u-page-subtitle">
            Track active outages, dispatch technicians, and document resolutions.
          </p>
        </div>
        <Button variant="error" iconName="Warning">
          Report Incident
        </Button>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={4}>
          <Card className="u-h-100 u-flex u-flex-column">
            <h2 className="u-text-lg u-font-bold u-mb-4">Live Network Map</h2>
            <div className="u-bg-dark u-rounded u-border u-border-secondary-subtle u-flex-grow-1 u-flex u-items-center u-justify-center u-relative u-min-h-75">
              <span className="u-text-secondary-emphasis u-text-sm u-font-mono">
                [ Mapbox GL Canvas ]
              </span>

              <div
                className="u-absolute u-bg-error u-rounded-circle u-flex u-items-center u-justify-center"
                style={{
                  width: "24px",
                  height: "24px",
                  top: "40%",
                  left: "60%",
                  boxShadow: "0 0 0 4px rgba(220, 53, 69, 0.2)",
                }}
              >
                <Icon name="Warning" size="sm" className="u-text-white" />
              </div>
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} lg={8}>
          <Card>
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <h2 className="u-text-lg u-font-bold">Incident Log</h2>
              <div className="u-w-25">
                <Select
                  value={severityFilter}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setSeverityFilter(event.target.value as SeverityFilter)
                  }
                  options={[
                    { label: "All Severities", value: "All" },
                    { label: "Critical", value: "Critical" },
                    { label: "Warning", value: "Warning" },
                    { label: "Low", value: "Low" },
                  ]}
                />
              </div>
            </div>

            <div className="u-overflow-x-auto u-mb-6">
              <DataTable columns={columns} data={filteredIncidents} rowKey="id" />
            </div>

            <div className="u-border-top u-border-secondary-subtle u-pt-6">
              <h3 className="u-text-base u-font-bold u-mb-4">
                Resolution Notes (Selected Incident)
              </h3>
              <div className="u-mb-4">
                <Textarea
                  placeholder="Enter detailed resolution steps or current investigation notes..."
                  rows={4}
                  fullWidth
                />
              </div>
              <div className="u-flex u-justify-end u-gap-4">
                <Button variant="outline-secondary">Save Draft</Button>
                <Button variant="primary">Submit & Resolve</Button>
              </div>
            </div>
          </Card>
        </GridCol>
      </Grid>
    </Container>
  );
}

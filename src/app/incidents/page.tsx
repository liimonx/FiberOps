"use client";

import { useState } from "react";
import {
  Card,
  Container,
  Grid,
  GridCol,
  Badge,
  Button,
  Icon,
  DataTable,
  DataTableColumn,
  Select,
  Textarea,
} from "@shohojdhara/atomix";

const mockIncidents = [
  {
    id: "INC-1042",
    title: "Node Alpha Outage",
    severity: "Critical",
    status: "Investigating",
    technician: "John Doe",
    time: "10m ago",
  },
  {
    id: "INC-1041",
    title: "High Attenuation on Splitter 08",
    severity: "Warning",
    status: "Assigned",
    technician: "Jane Smith",
    time: "2h ago",
  },
  {
    id: "INC-1040",
    title: "Customer ONT Offline",
    severity: "Low",
    status: "Resolved",
    technician: "Bob Lee",
    time: "1d ago",
  },
  {
    id: "INC-1039",
    title: "Fiber Cut Reported",
    severity: "Critical",
    status: "In Progress",
    technician: "Sarah Connor",
    time: "1d ago",
  },
];

export default function IncidentsPage() {
  const [severityFilter, setSeverityFilter] = useState("All");

  const filteredIncidents =
    severityFilter === "All"
      ? mockIncidents
      : mockIncidents.filter((inc) => inc.severity === severityFilter);

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

  return (
    <Container className="u-py-6 u-w-100">
      <div className="u-flex u-justify-between u-items-center u-mb-6">
        <div>
          <h1 className="u-text-xxl u-font-bold u-mb-2">Incident Management</h1>
          <p className="u-text-secondary-emphasis u-text-sm">
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
            <div
              className="u-bg-dark u-rounded u-border u-border-secondary-subtle u-flex-grow-1 u-flex u-items-center u-justify-center u-relative"
              style={{ minHeight: "300px" }}
            >
              <span className="u-text-secondary-emphasis u-text-sm u-font-mono">
                [ Mapbox GL Canvas ]
              </span>

              {/* Mock Map Pinpoint */}
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
                <Icon name="Warning" size="sm" className="" />
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
                  onChange={(val) => setSeverityFilter(String(val))}
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

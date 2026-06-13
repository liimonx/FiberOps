"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Input,
} from "@shohojdhara/atomix";
import {
  useAssets,
  useIncidents,
} from "@/modules/network-map/hooks/useNetworkData";
import {
  mapIncidentToTableRow,
  type IncidentTableRow,
} from "@/lib/operationsViewMappers";
import { IncidentMapPreview } from "@/modules/incidents/components/IncidentMapPreview";
import { ReportIncidentModal } from "@/modules/incidents/components/ReportIncidentModal";
import { IncidentDetailPanel } from "@/modules/incidents/components/IncidentDetailPanel";

type SeverityFilter = "All" | "Critical" | "Warning" | "Low";

function IncidentsPageContent() {
  const { data: incidents, isLoading, isError, refetch } = useIncidents();
  const { data: assets } = useAssets();
  const searchParams = useSearchParams();
  const router = useRouter();
  const handledDeepLinkRef = useRef<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    const selected = searchParams.get("selected");
    if (!selected || handledDeepLinkRef.current === selected) return;

    handledDeepLinkRef.current = selected;
    setSelectedIncidentId(selected);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("selected");
    const query = nextParams.toString();
    router.replace(query ? `/incidents?${query}` : "/incidents", { scroll: false });
  }, [searchParams, router]);

  const tableRows = useMemo(
    () => (incidents ?? []).map(mapIncidentToTableRow),
    [incidents]
  );

  const stats = useMemo(() => {
    const all = incidents ?? [];
    return {
      total: all.length,
      active: all.filter((incident) => incident.status !== "resolved").length,
      critical: all.filter(
        (incident) =>
          incident.severity === "critical" && incident.status !== "resolved"
      ).length,
    };
  }, [incidents]);

  const filteredIncidents = tableRows.filter((incident) => {
    const matchesSeverity =
      severityFilter === "All" || incident.severity === severityFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      incident.id.toLowerCase().includes(query) ||
      incident.title.toLowerCase().includes(query) ||
      incident.technician.toLowerCase().includes(query);

    return matchesSeverity && matchesSearch;
  });

  const selectedIncident = useMemo(
    () => (incidents ?? []).find((incident) => incident.id === selectedIncidentId) ?? null,
    [incidents, selectedIncidentId]
  );

  const selectedAsset = useMemo(() => {
    if (!selectedIncident?.relatedAssetId) return null;
    return (assets ?? []).find((asset) => asset.id === selectedIncident.relatedAssetId) ?? null;
  }, [assets, selectedIncident]);

  const handleSelectIncident = useCallback((id: string) => {
    setSelectedIncidentId(id);
  }, []);

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
      render: (_, row: IncidentTableRow) => (
        <Button
          variant={row.id === selectedIncidentId ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => handleSelectIncident(row.id)}
        >
          View
        </Button>
      ),
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
        <Button
          variant="error"
          iconName="Warning"
          onClick={() => setIsReportModalOpen(true)}
        >
          Report Incident
        </Button>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={4}>
          <Card appearance="outlined" className="u-h-100 u-flex u-flex-column">
            <div className="u-map-preview-header">
              <h2 className="u-text-lg u-font-bold u-mb-0">Live Network Map</h2>
              <span className="u-live-pill u-live-pill--error">
                <span className="u-live-pill__dot" aria-hidden="true" />
                Live
              </span>
            </div>
            <IncidentMapPreview
              incidents={incidents ?? []}
              assets={assets ?? []}
              selectedId={selectedIncidentId}
              onSelect={handleSelectIncident}
            />
          </Card>
        </GridCol>

        <GridCol xs={12} lg={8}>
          <Card appearance="outlined">
            <div className="u-stat-pills">
              <span className="u-stat-pill">
                <Icon name="ListBullets" size="sm" />
                {stats.total} total
              </span>
              <span className="u-stat-pill u-stat-pill--warning">
                <Icon name="Pulse" size="sm" />
                {stats.active} active
              </span>
              <span className="u-stat-pill u-stat-pill--error">
                <Icon name="Warning" size="sm" />
                {stats.critical} critical
              </span>
            </div>

            <div className="u-log-header">
              <div>
                <h2 className="u-text-lg u-font-bold u-mb-1">Incident Log</h2>
                <p className="u-meta u-mb-0">
                  {filteredIncidents.length} of {stats.total} incidents shown
                </p>
              </div>
            </div>

            <div className="u-filter-bar">
              <div className="u-filter-bar__search">
                <label className="u-filter-bar__label" htmlFor="incident-log-search">
                  Search
                </label>
                <Input
                  id="incident-log-search"
                  placeholder="Ticket ID, description, or technician..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  prefixIcon={<Icon name="MagnifyingGlass" />}
                  fullWidth
                />
              </div>
              <div className="u-filter-bar__field">
                <label className="u-filter-bar__label" htmlFor="incident-severity-filter">
                  Severity
                </label>
                <Select
                  id="incident-severity-filter"
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

            <div className="u-overflow-x-auto">
              <DataTable
                columns={columns}
                data={filteredIncidents}
                rowKey="id"
                striped
                selectionMode="single"
                selectedRowIds={selectedIncidentId ? [selectedIncidentId] : []}
                onRowClick={(row: IncidentTableRow) => handleSelectIncident(row.id)}
                onSelectionChange={(_, selectedIds) => {
                  const nextId = selectedIds[0];
                  setSelectedIncidentId(
                    typeof nextId === "string" ? nextId : nextId != null ? String(nextId) : null
                  );
                }}
                emptyMessage="No incidents match your filters."
              />
            </div>
          </Card>
        </GridCol>
      </Grid>

      <IncidentDetailPanel
        open={Boolean(selectedIncident)}
        incident={selectedIncident}
        relatedAsset={selectedAsset}
        onClose={() => setSelectedIncidentId(null)}
      />

      <ReportIncidentModal
        open={isReportModalOpen}
        assets={assets ?? []}
        onClose={() => setIsReportModalOpen(false)}
        onCreated={(incidentId) => setSelectedIncidentId(incidentId)}
      />
    </Container>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense fallback={null}>
      <IncidentsPageContent />
    </Suspense>
  );
}

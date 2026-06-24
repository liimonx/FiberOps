"use client";

import { useCallback, useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
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
  Input,
  Select,
} from "@shohojdhara/atomix";
import {
  useAssets,
  useIncidents,
} from "@/modules/network-map/hooks/useNetworkData";
import { mapAssetToTableRow } from "@/lib/operationsViewMappers";
import { RegisterAssetModal } from "@/modules/assets/components/RegisterAssetModal";
import { AssetDetailPanel } from "@/modules/assets/components/AssetDetailPanel";
import { getAssetKindIcon } from "@/modules/assets/lib/assetKindIcons";
import { getAssetMapUrl } from "@/modules/assets/lib/assetMapNavigation";
import {
  assetKindLabels,
  assetKinds,
  assetStatusLabels,
  assetStatuses,
} from "@/modules/assets/schemas/asset.schema";
import type { AssetKind, AssetStatus } from "@/types/domain";

type StatusFilter = "All" | AssetStatus;
type KindFilter = "All" | AssetKind;

function assetStatusBadgeVariant(
  status: AssetStatus
): "success" | "warning" | "error" {
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

export default function AssetsPage() {
  const router = useRouter();
  const { data: assets, isLoading, isError, refetch } = useAssets();
  const { data: incidents } = useIncidents();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [kindFilter, setKindFilter] = useState<KindFilter>("All");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const assetList = assets ?? [];
  const incidentList = incidents ?? [];

  const incidentsByAssetId = useMemo(() => {
    const map = new Map<string, typeof incidentList>();
    for (const incident of incidentList) {
      if (!incident.relatedAssetId || incident.status === "resolved") continue;
      const existing = map.get(incident.relatedAssetId) ?? [];
      map.set(incident.relatedAssetId, [...existing, incident]);
    }
    return map;
  }, [incidentList]);

  const tableRows = useMemo(
    () => assetList.map(mapAssetToTableRow),
    [assetList]
  );

  const stats = useMemo(() => {
    const all = assetList;
    return {
      total: all.length,
      active: all.filter((asset) => asset.status === "active").length,
      degraded: all.filter(
        (asset) => asset.status === "degraded" || asset.status === "maintenance"
      ).length,
      down: all.filter((asset) => asset.status === "down").length,
    };
  }, [assetList]);

  const filteredAssets = tableRows.filter((row) => {
    const domain = assetList.find((asset) => asset.id === row.id);
    const matchesStatus =
      statusFilter === "All" || domain?.status === statusFilter;
    const matchesKind = kindFilter === "All" || domain?.kind === kindFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      row.id.toLowerCase().includes(query) ||
      row.type.toLowerCase().includes(query) ||
      row.location.toLowerCase().includes(query);

    return matchesStatus && matchesKind && matchesSearch;
  });

  const selectedAsset = useMemo(
    () => assetList.find((asset) => asset.id === selectedAssetId) ?? null,
    [assetList, selectedAssetId]
  );

  const selectedIncidents = useMemo(() => {
    if (!selectedAssetId) return [];
    return incidentsByAssetId.get(selectedAssetId) ?? [];
  }, [selectedAssetId, incidentsByAssetId]);

  const handleSelectAsset = useCallback((id: string) => {
    setSelectedAssetId(id);
  }, []);

  const handleViewOnMap = useCallback(
    (event: MouseEvent, assetId: string) => {
      event.stopPropagation();
      router.push(getAssetMapUrl(assetId));
    },
    [router]
  );

  const columns: DataTableColumn[] = [
    {
      key: "id",
      title: "Asset ID",
      render: (value) => <span className="u-font-mono u-text-sm">{value}</span>,
    },
    {
      key: "type",
      title: "Type / Name",
      render: (value, row) => {
        const domain = assetList.find((asset) => asset.id === row.id);
        const kindIcon = domain ? getAssetKindIcon(domain.kind) : "Circle";
        return (
          <div className="u-flex u-items-center u-gap-2">
            <Icon name={kindIcon} size="sm" className="u-text-secondary-emphasis" />
            <div className="u-flex u-flex-column">
              <span className="u-font-bold">{row.location}</span>
              <span className="u-text-sm u-text-secondary-emphasis">{value}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (value, row) => {
        const domain = assetList.find((asset) => asset.id === row.id);
        const status = domain?.status ?? "active";
        return (
          <Badge
            variant={assetStatusBadgeVariant(status)}
            label={assetStatusLabels[status] ?? value}
          />
        );
      },
    },
    {
      key: "lastMaintenance",
      title: "Last Maintenance",
      render: (value) => <span className="u-font-mono u-text-sm">{value}</span>,
    },
    {
      key: "actions",
      title: "",
      render: (_, row) => (
        <Button
          variant="outline-secondary"
          size="sm"
          iconName="MapTrifold"
          onClick={(event) => handleViewOnMap(event, row.id)}
        >
          Map
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
        <Callout variant="error" title="Failed to load assets">
          <p className="u-text-sm u-mb-3">
            The assets inventory could not be loaded. Please try again.
          </p>
          <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Callout>
      </Container>
    );
  }

  return (
    <Container className="u-page u-split-page">
      <div className="u-page-header">
        <div>
          <h1 className="u-page-title">Assets Inventory</h1>
          <p className="u-page-subtitle">
            Manage infrastructure assets, connection graphs, and maintenance logs.
          </p>
        </div>
        <Button
          variant="primary"
          iconName="Plus"
          onClick={() => setIsRegisterModalOpen(true)}
        >
          Register Asset
        </Button>
      </div>

      <Grid className="u-mb-6 u-split-layout">
        <GridCol xs={12} lg={7} className="u-split-layout__main">
          <Card appearance="outlined" className="u-h-100 u-split-layout__card">
            <div className="u-stat-pills">
              <span className="u-stat-pill">
                <Icon name="HardDrives" size="sm" />
                {stats.total} total
              </span>
              <span className="u-stat-pill u-stat-pill--success">
                <Icon name="CheckCircle" size="sm" />
                {stats.active} active
              </span>
              <span className="u-stat-pill u-stat-pill--warning">
                <Icon name="Wrench" size="sm" />
                {stats.degraded} degraded
              </span>
              <span className="u-stat-pill u-stat-pill--error">
                <Icon name="Warning" size="sm" />
                {stats.down} down
              </span>
            </div>

            <div className="u-log-header">
              <div>
                <h2 className="u-text-lg u-font-bold u-mb-1">Asset Directory</h2>
                <p className="u-meta u-mb-0">
                  {filteredAssets.length} of {stats.total} assets shown
                </p>
              </div>
            </div>

            <div className="u-filter-bar u-filter-bar--3col">
              <div className="u-filter-bar__search">
                <label className="u-filter-bar__label" htmlFor="asset-search">
                  Search
                </label>
                <Input
                  id="asset-search"
                  placeholder="ID, name, or type..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  prefixIcon={<Icon name="MagnifyingGlass" />}
                  fullWidth
                />
              </div>
              <div className="u-filter-bar__field">
                <label className="u-filter-bar__label" htmlFor="asset-status-filter">
                  Status
                </label>
                <Select
                  id="asset-status-filter"
                  value={statusFilter}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  options={[
                    { label: "All Statuses", value: "All" },
                    ...assetStatuses.map((status) => ({
                      label: assetStatusLabels[status],
                      value: status,
                    })),
                  ]}
                />
              </div>
              <div className="u-filter-bar__field">
                <label className="u-filter-bar__label" htmlFor="asset-kind-filter">
                  Type
                </label>
                <Select
                  id="asset-kind-filter"
                  value={kindFilter}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setKindFilter(event.target.value as KindFilter)
                  }
                  options={[
                    { label: "All Types", value: "All" },
                    ...assetKinds.map((kind) => ({
                      label: assetKindLabels[kind],
                      value: kind,
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="u-table-scroll">
              <DataTable
                columns={columns}
                data={filteredAssets}
                rowKey="id"
                striped
                stickyHeader
                selectionMode="single"
                selectedRowIds={selectedAssetId ? [selectedAssetId] : []}
                onRowClick={(row) => handleSelectAsset(row.id)}
                onSelectionChange={(_, selectedIds) => {
                  const nextId = selectedIds[0];
                  setSelectedAssetId(
                    typeof nextId === "string" ? nextId : nextId != null ? String(nextId) : null
                  );
                }}
                emptyMessage="No assets match your filters."
              />
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} lg={5} className="u-split-layout__side">
          <Card appearance="outlined" className="u-h-100">
            {selectedAsset ? (
              <AssetDetailPanel
                key={selectedAsset.id}
                asset={selectedAsset}
                relatedIncidents={selectedIncidents}
                layout="sidebar"
                onClose={() => setSelectedAssetId(null)}
              />
            ) : (
              <div className="u-empty-state-panel u-h-100">
                <Icon name="HardDrives" size="lg" className="u-text-secondary-emphasis" />
                <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                  Select an asset from the directory to view details, maintenance
                  history, and network connections.
                </p>
              </div>
            )}
          </Card>
        </GridCol>
      </Grid>

      <RegisterAssetModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onCreated={(asset) => setSelectedAssetId(asset.id)}
      />
    </Container>
  );
}

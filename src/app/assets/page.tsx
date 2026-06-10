"use client";

import { useMemo, useState } from "react";
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
  Tabs,
} from "@shohojdhara/atomix";
import { useAssets } from "@/modules/network-map/hooks/useNetworkData";
import {
  mapAssetToTableRow,
  type AssetTableRow,
} from "@/lib/operationsViewMappers";
import { RegisterAssetModal } from "@/modules/assets/components/RegisterAssetModal";

export default function AssetsPage() {
  const { data: assets, isLoading, isError, refetch } = useAssets();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetTableRow | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const tableRows = useMemo(
    () => (assets ?? []).map(mapAssetToTableRow),
    [assets]
  );

  const filteredAssets = tableRows.filter(
    (asset) =>
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: DataTableColumn[] = [
    {
      key: "id",
      title: "Asset ID",
      render: (val) => <span className="u-font-bold">{val}</span>,
    },
    { key: "type", title: "Type" },
    { key: "location", title: "Location" },
    {
      key: "status",
      title: "Status",
      render: (val) => {
        let variant: "success" | "warning" | "error" = "success";
        if (val === "Warning") variant = "warning";
        if (val === "Critical") variant = "error";
        return <Badge variant={variant} label={val} />;
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (_, row) => (
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setSelectedAsset(row)}
        >
          Details
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
    <Container className="u-page">
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

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={selectedAsset ? 7 : 12}>
          <Card>
            <div className="u-mb-4">
              <Input
                placeholder="Search assets by ID, type, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefixIcon={<Icon name="MagnifyingGlass" />}
                fullWidth
              />
            </div>
            <div className="u-overflow-x-auto">
              <DataTable columns={columns} data={filteredAssets} rowKey="id" />
            </div>
          </Card>
        </GridCol>

        {selectedAsset && (
          <GridCol xs={12} lg={5}>
            <Card>
              <div className="u-flex u-justify-between u-items-start u-mb-6">
                <div>
                  <h2 className="u-text-lg u-font-bold u-mb-1">{selectedAsset.id}</h2>
                  <p className="u-text-secondary-emphasis u-text-sm u-mb-0">
                    {selectedAsset.type} • {selectedAsset.location}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  iconName="X"
                  onClick={() => setSelectedAsset(null)}
                />
              </div>

              <Tabs activeIndex={activeTab} onTabChange={setActiveTab}>
                <Tabs.List className="u-mb-4">
                  <Tabs.Trigger index={0}>Details</Tabs.Trigger>
                  <Tabs.Trigger index={1}>Maintenance</Tabs.Trigger>
                  <Tabs.Trigger index={2}>Connection Graph</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Panels>
                  <Tabs.Panel index={0}>
                    <div className="u-flex u-flex-column u-gap-4">
                      <div className="u-p-4 u-bg-dark u-rounded u-border u-border-secondary-subtle">
                        <div className="u-flex u-justify-between u-mb-2">
                          <span className="u-text-secondary-emphasis u-text-sm">
                            Status
                          </span>
                          <Badge
                            variant={
                              selectedAsset.status === "Active"
                                ? "success"
                                : selectedAsset.status === "Warning"
                                  ? "warning"
                                  : "error"
                            }
                            label={selectedAsset.status}
                          />
                        </div>
                        <div className="u-flex u-justify-between u-mb-2">
                          <span className="u-text-secondary-emphasis u-text-sm">
                            Last Maintenance
                          </span>
                          <span className="u-font-mono u-text-sm">
                            {selectedAsset.lastMaintenance}
                          </span>
                        </div>
                        <div className="u-flex u-justify-between">
                          <span className="u-text-secondary-emphasis u-text-sm">
                            Coordinates
                          </span>
                          <span className="u-font-mono u-text-sm">
                            {selectedAsset.coordinates}
                          </span>
                        </div>
                      </div>

                      <h3 className="u-text-base u-font-bold u-mt-2 u-mb-2">Photos</h3>
                      <div
                        className="u-grid u-gap-2"
                        style={{ gridTemplateColumns: "1fr 1fr" }}
                      >
                        <div className="u-bg-dark u-rounded u-border u-border-secondary-subtle u-flex u-items-center u-justify-center u-h-25">
                          <Icon
                            name="Image"
                            className="u-text-secondary-emphasis"
                            size="lg"
                          />
                        </div>
                        <div className="u-bg-dark u-rounded u-border u-border-secondary-subtle u-flex u-items-center u-justify-center u-h-25">
                          <Icon
                            name="Image"
                            className="u-text-secondary-emphasis"
                            size="lg"
                          />
                        </div>
                      </div>
                    </div>
                  </Tabs.Panel>
                  <Tabs.Panel index={1}>
                    <div className="u-flex u-flex-column u-gap-4">
                      <div className="u-border-start u-border-primary u-ps-4 u-py-2">
                        <div className="u-font-bold u-text-sm">Routine Inspection</div>
                        <div className="u-text-secondary-emphasis u-text-xs u-mb-1">
                          {selectedAsset.lastMaintenance}
                        </div>
                        <p className="u-text-sm u-mb-0">
                          Checked signal attenuation. Cleaned optical connectors.
                        </p>
                      </div>
                      <div className="u-border-start u-border-secondary-subtle u-ps-4 u-py-2">
                        <div className="u-font-bold u-text-sm">Firmware Update</div>
                        <div className="u-text-secondary-emphasis u-text-xs u-mb-1">
                          2023-11-05
                        </div>
                        <p className="u-text-sm u-mb-0">
                          Updated to v2.4.1 to patch security vulnerability.
                        </p>
                      </div>
                    </div>
                  </Tabs.Panel>
                  <Tabs.Panel index={2}>
                    <div className="u-bg-dark u-rounded u-border u-border-secondary-subtle u-flex u-items-center u-justify-center u-h-62">
                      <span className="u-text-secondary-emphasis u-text-sm u-font-mono">
                        [ Topology Graph Placeholder ]
                      </span>
                    </div>
                  </Tabs.Panel>
                </Tabs.Panels>
              </Tabs>
            </Card>
          </GridCol>
        )}
      </Grid>

      <RegisterAssetModal
        open={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onCreated={(asset) => {
          setSelectedAsset(mapAssetToTableRow(asset));
          setActiveTab(0);
        }}
      />
    </Container>
  );
}

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
  Select,
  Input,
} from "@shohojdhara/atomix";
import {
  useAssets,
  useIncidents,
} from "@/modules/network-map/hooks/useNetworkData";
import { useCustomers } from "@/modules/customers/hooks/useCustomersData";
import {
  mapCustomerToTableRow,
  type CustomerTableRow,
} from "@/lib/operationsViewMappers";
import { buildCustomerConnectionPath } from "@/modules/customers/lib/buildCustomerConnectionPath";
import {
  billingLabels,
  statusLabels,
} from "@/modules/customers/schemas/customer.schema";
import { AddCustomerModal } from "@/modules/customers/components/AddCustomerModal";
import { CustomerDetailPanel } from "@/modules/customers/components/CustomerDetailPanel";
import { getCustomerMapUrl } from "@/modules/customers/lib/customerMapNavigation";
import type { BillingStatus, CustomerStatus } from "@/types/domain";

type StatusFilter = "All" | CustomerStatus;
type BillingFilter = "All" | BillingStatus;

export default function CustomersPage() {
  const router = useRouter();
  const { data: customers, isLoading, isError, refetch } = useCustomers();
  const { data: incidents } = useIncidents();
  const { data: assets } = useAssets();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const assetList = assets ?? [];
  const incidentList = incidents ?? [];
  const customerList = customers ?? [];

  const assetById = useMemo(
    () => new Map(assetList.map((asset) => [asset.id, asset])),
    [assetList]
  );

  const incidentsByOnuId = useMemo(() => {
    const map = new Map<string, typeof incidentList>();
    for (const incident of incidentList) {
      if (!incident.relatedAssetId) continue;
      const existing = map.get(incident.relatedAssetId) ?? [];
      map.set(incident.relatedAssetId, [...existing, incident]);
    }
    return map;
  }, [incidentList]);

  const tableRows = useMemo(() => {
    return customerList.map((customer) => {
      const relatedOnu = customer.relatedOnuId
        ? assetById.get(customer.relatedOnuId) ?? null
        : null;
      const relatedIncidents = customer.relatedOnuId
        ? incidentsByOnuId.get(customer.relatedOnuId) ?? []
        : [];

      return mapCustomerToTableRow(customer, {
        incidentHistory: relatedIncidents.length,
        connectionPath: buildCustomerConnectionPath(customer, assetList),
        relatedOnu,
      });
    });
  }, [customerList, assetById, incidentsByOnuId, assetList]);

  const stats = useMemo(() => {
    const all = customerList;
    return {
      total: all.length,
      online: all.filter((c) => c.status === "online").length,
      degraded: all.filter((c) => c.status === "unstable" || c.status === "offline").length,
      overdue: all.filter((c) => c.billingStatus === "overdue").length,
    };
  }, [customerList]);

  const filteredCustomers = tableRows.filter((customer) => {
    const domain = customerList.find((c) => c.id === customer.id);
    const matchesStatus =
      statusFilter === "All" || domain?.status === statusFilter;
    const matchesBilling =
      billingFilter === "All" || domain?.billingStatus === billingFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      customer.id.toLowerCase().includes(query) ||
      customer.name.toLowerCase().includes(query) ||
      (domain?.email?.toLowerCase().includes(query) ?? false);

    return matchesStatus && matchesBilling && matchesSearch;
  });

  const selectedCustomer = useMemo(
    () => customerList.find((c) => c.id === selectedCustomerId) ?? null,
    [customerList, selectedCustomerId]
  );

  const selectedOnu = useMemo(() => {
    if (!selectedCustomer?.relatedOnuId) return null;
    return assetById.get(selectedCustomer.relatedOnuId) ?? null;
  }, [selectedCustomer, assetById]);

  const selectedIncidents = useMemo(() => {
    if (!selectedCustomer?.relatedOnuId) return [];
    return incidentsByOnuId.get(selectedCustomer.relatedOnuId) ?? [];
  }, [selectedCustomer, incidentsByOnuId]);

  const handleSelectCustomer = useCallback((id: string) => {
    setSelectedCustomerId(id);
  }, []);

  const handleViewOnMap = useCallback(
    (event: MouseEvent, customerId: string) => {
      event.stopPropagation();
      router.push(getCustomerMapUrl(customerId));
    },
    [router]
  );

  const columns: DataTableColumn[] = [
    {
      key: "id",
      title: "Customer ID",
      render: (value) => <span className="u-font-mono u-text-sm">{value}</span>,
    },
    {
      key: "name",
      title: "Profile / Name",
      render: (value, row) => (
        <div className="u-flex u-flex-column">
          <span className="u-font-bold">{value}</span>
          <span className="u-text-sm u-text-secondary-emphasis">{row.type}</span>
        </div>
      ),
    },
    {
      key: "signalHealth",
      title: "Signal Health",
      render: (value) => {
        let variant: "success" | "warning" | "error" = "success";
        if (value < 80) variant = "warning";
        if (value < 50) variant = "error";
        return <Badge variant={variant} label={`${value}%`} />;
      },
    },
    {
      key: "connectionPath",
      title: "Connection Path",
      render: (value) => (
        <span className="u-text-sm u-font-mono u-text-secondary-emphasis">{value}</span>
      ),
    },
    {
      key: "billingStatus",
      title: "Billing",
      render: (value) => {
        const variant: "success" | "error" | "warning" =
          value === "paid" ? "success" : value === "overdue" ? "error" : "warning";
        return (
          <Badge
            variant={variant}
            label={billingLabels[value as BillingStatus].toUpperCase()}
          />
        );
      },
    },
    {
      key: "incidentHistory",
      title: "Incidents",
      render: (value) => (
        <Badge
          variant={value > 0 ? "error" : "secondary"}
          label={`${value} ${value === 1 ? "Incident" : "Incidents"}`}
        />
      ),
    },
    {
      key: "actions",
      title: "",
      render: (_, row: CustomerTableRow) => (
        <Button
          variant="outline-secondary"
          size="sm"
          iconName="MapTrifold"
          onClick={(event) => handleViewOnMap(event, row.id)}
        >
          View
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Container className="u-page" aria-busy="true">
        <div className="u-skeleton u-h-10 u-mb-6" style={{ width: "10rem" }} />
        <div className="u-skeleton u-h-64" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="u-page">
        <Callout variant="error" title="Failed to load customers">
          <p className="u-text-sm u-mb-3">
            Customer profiles could not be loaded. Please try again.
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
          <h1 className="u-page-title">Customers</h1>
          <p className="u-page-subtitle">
            Manage customer profiles, check signal health, and track incident history.
          </p>
        </div>
        <Button
          variant="primary"
          iconName="Plus"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      <Grid className="u-mb-6 u-split-layout">
        <GridCol xs={12} lg={7} className="u-split-layout__main">
          <Card appearance="outlined" className="u-h-100 u-split-layout__card">
            <div className="u-stat-pills">
              <span className="u-stat-pill">
                <Icon name="Users" size="sm" />
                {stats.total} total
              </span>
              <span className="u-stat-pill u-stat-pill--success">
                <Icon name="CheckCircle" size="sm" />
                {stats.online} online
              </span>
              <span className="u-stat-pill u-stat-pill--warning">
                <Icon name="Pulse" size="sm" />
                {stats.degraded} degraded
              </span>
              <span className="u-stat-pill u-stat-pill--error">
                <Icon name="CreditCard" size="sm" />
                {stats.overdue} overdue
              </span>
            </div>

            <div className="u-log-header">
              <div>
                <h2 className="u-text-lg u-font-bold u-mb-1">Customer Directory</h2>
                <p className="u-meta u-mb-0">
                  {filteredCustomers.length} of {stats.total} customers shown
                </p>
              </div>
            </div>

            <div className="u-filter-bar u-filter-bar--3col">
              <div className="u-filter-bar__search">
                <label className="u-filter-bar__label" htmlFor="customer-search">
                  Search
                </label>
                <Input
                  id="customer-search"
                  placeholder="Name, ID, or email..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  prefixIcon={<Icon name="MagnifyingGlass" />}
                  fullWidth
                />
              </div>
              <div className="u-filter-bar__field">
                <label className="u-filter-bar__label" htmlFor="customer-status-filter">
                  Status
                </label>
                <Select
                  id="customer-status-filter"
                  value={statusFilter}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  options={[
                    { label: "All Statuses", value: "All" },
                    { label: statusLabels.online, value: "online" },
                    { label: statusLabels.unstable, value: "unstable" },
                    { label: statusLabels.offline, value: "offline" },
                  ]}
                />
              </div>
              <div className="u-filter-bar__field">
                <label className="u-filter-bar__label" htmlFor="customer-billing-filter">
                  Billing
                </label>
                <Select
                  id="customer-billing-filter"
                  value={billingFilter}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    setBillingFilter(event.target.value as BillingFilter)
                  }
                  options={[
                    { label: "All Billing", value: "All" },
                    { label: billingLabels.paid, value: "paid" },
                    { label: billingLabels.overdue, value: "overdue" },
                    { label: billingLabels.unpaid, value: "unpaid" },
                  ]}
                />
              </div>
            </div>

            <div className="u-table-scroll">
              <DataTable
                columns={columns}
                data={filteredCustomers}
                rowKey="id"
                striped
                stickyHeader
                selectionMode="single"
                selectedRowIds={selectedCustomerId ? [selectedCustomerId] : []}
                onRowClick={(row: CustomerTableRow) => handleSelectCustomer(row.id)}
                onSelectionChange={(_, selectedIds) => {
                  const nextId = selectedIds[0];
                  setSelectedCustomerId(
                    typeof nextId === "string" ? nextId : nextId != null ? String(nextId) : null
                  );
                }}
                emptyMessage="No customers match your filters."
              />
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} lg={5} className="u-split-layout__side">
          <Card appearance="outlined" className="u-h-100">
            {selectedCustomer ? (
              <CustomerDetailPanel
                key={`${selectedCustomer.id}-${selectedCustomer.updatedAt}`}
                customer={selectedCustomer}
                relatedOnu={selectedOnu}
                relatedIncidents={selectedIncidents}
                assets={assetList}
                layout="sidebar"
                onClose={() => setSelectedCustomerId(null)}
              />
            ) : (
              <div className="u-empty-state-panel u-h-100">
                <Icon name="Users" size="lg" className="u-text-secondary-emphasis" />
                <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
                  Select a customer from the directory to view their profile, connection
                  path, and incident history.
                </p>
              </div>
            )}
          </Card>
        </GridCol>
      </Grid>

      <AddCustomerModal
        open={isAddModalOpen}
        assets={assetList}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={(customerId) => setSelectedCustomerId(customerId)}
      />
    </Container>
  );
}

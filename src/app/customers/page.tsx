"use client";

import { useMemo, useState } from "react";
import {
  Card,
  Container,
  DataTable,
  DataTableColumn,
  Badge,
  Button,
  Callout,
  Input,
  Icon,
  Grid,
  GridCol,
} from "@shohojdhara/atomix";
import {
  useCustomers,
  useIncidents,
} from "@/modules/network-map/hooks/useNetworkData";
import { mapCustomerToTableRow } from "@/lib/operationsViewMappers";

export default function CustomersPage() {
  const { data: customers, isLoading, isError, refetch } = useCustomers();
  const { data: incidents } = useIncidents();
  const [searchTerm, setSearchTerm] = useState("");

  const tableRows = useMemo(() => {
    return (customers ?? []).map((customer) => {
      const incidentHistory = (incidents ?? []).filter((incident) =>
        incident.title.toLowerCase().includes(customer.name.split(" ")[0]?.toLowerCase() ?? "")
      ).length;

      return mapCustomerToTableRow(customer, incidentHistory);
    });
  }, [customers, incidents]);

  const filteredCustomers = tableRows.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: DataTableColumn[] = [
    {
      key: "id",
      title: "Customer ID",
      render: (value) => <span className="u-font-bold">{value}</span>,
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
        return (
          <div className="u-flex u-items-center u-gap-2">
            <Badge variant={variant} label={`${value}%`} />
          </div>
        );
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
        return <Badge variant={variant} label={value.toUpperCase()} />;
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
      title: "Actions",
      render: () => (
        <Button variant="outline-secondary" size="sm" iconName="ArrowRight">
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
    <Container className="u-page">
      <Grid className="u-mb-6">
        <GridCol xs={12}>
          <Card appearance="outlined">
            <div className="u-page-header">
              <div>
                <h1 className="u-page-title">Customers</h1>
                <p className="u-page-subtitle">
                  Manage customer profiles, check signal health, and track incident
                  history.
                </p>
              </div>
              <div className="u-flex u-items-center u-gap-4">
                <Button variant="primary" iconName="Plus">
                  Add Customer
                </Button>
              </div>
            </div>

            <div className="u-mb-6 u-w-100">
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefixIcon={<Icon name="MagnifyingGlass" />}
                fullWidth
              />
            </div>

            <div className="u-w-100 u-overflow-x-auto">
              <DataTable columns={columns} data={filteredCustomers} rowKey="id" />
            </div>
          </Card>
        </GridCol>
      </Grid>
    </Container>
  );
}

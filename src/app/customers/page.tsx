"use client";

import { useState } from "react";
import {
  Card,
  Container,
  DataTable,
  DataTableColumn,
  Badge,
  Button,
  Input,
  Icon,
  Grid,
  GridCol,
} from "@shohojdhara/atomix";

// Mock Data
const mockCustomers = [
  {
    id: "CUST-8012",
    name: "Acme Corp",
    type: "Enterprise",
    signalHealth: 98,
    connectionPath: "Node Alpha -> Splitter 12 -> ONT-55",
    billingStatus: "paid",
    incidentHistory: 0,
  },
  {
    id: "CUST-8013",
    name: "Globex Inc",
    type: "Business",
    signalHealth: 75,
    connectionPath: "Node Beta -> Splitter 08 -> ONT-21",
    billingStatus: "overdue",
    incidentHistory: 2,
  },
  {
    id: "CUST-8014",
    name: "Soylent Corp",
    type: "Enterprise",
    signalHealth: 99,
    connectionPath: "Node Gamma -> Splitter 04 -> ONT-11",
    billingStatus: "paid",
    incidentHistory: 1,
  },
  {
    id: "CUST-8015",
    name: "Initech",
    type: "Business",
    signalHealth: 45,
    connectionPath: "Node Delta -> Splitter 02 -> ONT-03",
    billingStatus: "unpaid",
    incidentHistory: 5,
  },
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Container className="u-py-6 u-w-100">
      <Grid className="u-mb-6">
        <GridCol xs={12}>
          <Card appearance="outlined">
            <div className="u-flex u-justify-between u-items-center u-mb-6">
              <div>
                <h1 className="u-text-2xl u-font-bold u-mb-2">Customers</h1>
                <p className="u-text-secondary-emphasis u-text-sm">
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

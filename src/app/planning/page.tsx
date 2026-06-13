"use client";

import { useCallback, useMemo, useState, type ChangeEvent } from "react";
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
import { useAssets } from "@/modules/network-map/hooks/useNetworkData";
import { usePlanningProposals } from "@/modules/planning/hooks/usePlanningProposalsData";
import {
  mapProposalToTableRow,
  type ProposalTableRow,
} from "@/lib/operationsViewMappers";
import {
  statusLabels,
  typeLabels,
} from "@/modules/planning/schemas/proposal.schema";
import { CreateProposalModal } from "@/modules/planning/components/CreateProposalModal";
import { ProposalDetailPanel } from "@/modules/planning/components/ProposalDetailPanel";
import type { ProposalStatus, ProposalType } from "@/types/domain";

type StatusFilter = "All" | ProposalStatus;
type TypeFilter = "All" | ProposalType;

function proposalStatusBadgeVariant(
  status: string
): "success" | "primary" | "warning" | "secondary" | "error" {
  if (status === "Approved" || status === "Completed") return "success";
  if (status === "In Review" || status === "In Progress") return "warning";
  if (status === "Cancelled") return "error";
  return "secondary";
}

export default function PlanningPage() {
  const { data: proposals, isLoading, isError, refetch } = usePlanningProposals();
  const { data: assets } = useAssets();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const proposalList = proposals ?? [];
  const assetList = assets ?? [];

  const tableRows = useMemo(
    () => proposalList.map(mapProposalToTableRow),
    [proposalList]
  );

  const stats = useMemo(() => {
    const all = proposalList;
    return {
      total: all.length,
      inReview: all.filter((p) => p.status === "review").length,
      approved: all.filter((p) => p.status === "approved" || p.status === "in_progress").length,
      totalBudget: all.reduce((sum, p) => sum + p.estimatedBudgetUsd, 0),
    };
  }, [proposalList]);

  const filteredProposals = tableRows.filter((row) => {
    const domain = proposalList.find((p) => p.id === row.id);
    const matchesStatus =
      statusFilter === "All" || domain?.status === statusFilter;
    const matchesType = typeFilter === "All" || domain?.type === typeFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      row.id.toLowerCase().includes(query) ||
      row.title.toLowerCase().includes(query) ||
      row.targetArea.toLowerCase().includes(query) ||
      row.owner.toLowerCase().includes(query);

    return matchesStatus && matchesType && matchesSearch;
  });

  const selectedProposal = useMemo(
    () => proposalList.find((p) => p.id === selectedProposalId) ?? null,
    [proposalList, selectedProposalId]
  );

  const selectedAsset = useMemo(() => {
    if (!selectedProposal?.relatedAssetId) return null;
    return assetList.find((a) => a.id === selectedProposal.relatedAssetId) ?? null;
  }, [assetList, selectedProposal]);

  const handleSelectProposal = useCallback((id: string) => {
    setSelectedProposalId(id);
  }, []);

  const columns: DataTableColumn[] = [
    {
      key: "id",
      title: "Proposal ID",
      render: (val) => <span className="u-font-mono u-text-sm">{val}</span>,
    },
    {
      key: "title",
      title: "Title",
      render: (val) => <span className="u-font-bold">{val}</span>,
    },
    { key: "type", title: "Type" },
    {
      key: "status",
      title: "Status",
      render: (val) => (
        <Badge variant={proposalStatusBadgeVariant(val)} label={val} />
      ),
    },
    { key: "targetArea", title: "Target Area" },
    {
      key: "newCustomers",
      title: "New Customers",
      render: (val) => <span className="u-font-mono u-text-sm">{val}</span>,
    },
    {
      key: "budget",
      title: "Budget",
      render: (val) => <span className="u-font-mono u-text-sm">{val}</span>,
    },
    { key: "owner", title: "Owner" },
    {
      key: "actions",
      title: "",
      render: (_, row: ProposalTableRow) => (
        <Button
          variant={row.id === selectedProposalId ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => handleSelectProposal(row.id)}
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
        <Callout variant="error" title="Failed to load planning proposals">
          <p className="u-text-sm u-mb-3">
            The planning module could not be loaded. Please try again.
          </p>
          <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Callout>
      </Container>
    );
  }

  const formattedTotalBudget = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(stats.totalBudget);

  return (
    <Container className="u-page">
      <div className="u-page-header">
        <div>
          <h1 className="u-page-title">Network Planning</h1>
          <p className="u-page-subtitle">
            Future network expansion, capacity forecasting, and budget modeling.
          </p>
        </div>
        <Button
          variant="primary"
          iconName="Plus"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Proposal
        </Button>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={6} sm={3}>
          <Card appearance="outlined" className="u-text-center u-py-4">
            <div className="u-text-2xl u-font-bold">{stats.total}</div>
            <div className="u-text-sm u-text-secondary-emphasis">Total Proposals</div>
          </Card>
        </GridCol>
        <GridCol xs={6} sm={3}>
          <Card appearance="outlined" className="u-text-center u-py-4">
            <div className="u-text-2xl u-font-bold">{stats.inReview}</div>
            <div className="u-text-sm u-text-secondary-emphasis">In Review</div>
          </Card>
        </GridCol>
        <GridCol xs={6} sm={3}>
          <Card appearance="outlined" className="u-text-center u-py-4">
            <div className="u-text-2xl u-font-bold">{stats.approved}</div>
            <div className="u-text-sm u-text-secondary-emphasis">Approved / Active</div>
          </Card>
        </GridCol>
        <GridCol xs={6} sm={3}>
          <Card appearance="outlined" className="u-text-center u-py-4">
            <div className="u-text-2xl u-font-bold">{formattedTotalBudget}</div>
            <div className="u-text-sm u-text-secondary-emphasis">Total Budget</div>
          </Card>
        </GridCol>
      </Grid>

      <Card appearance="outlined">
        <div className="u-log-header">
          <div>
            <h2 className="u-text-lg u-font-bold u-mb-1">Expansion Proposals</h2>
            <p className="u-meta u-mb-0">
              {filteredProposals.length} of {stats.total} proposals shown
            </p>
          </div>
        </div>

        <div className="u-filter-bar u-filter-bar--3col">
          <div className="u-filter-bar__search">
            <label className="u-filter-bar__label" htmlFor="planning-search">
              Search
            </label>
            <Input
              id="planning-search"
              placeholder="ID, title, area, or owner..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              prefixIcon={<Icon name="MagnifyingGlass" />}
              fullWidth
            />
          </div>
          <div className="u-filter-bar__field">
            <label className="u-filter-bar__label" htmlFor="planning-status-filter">
              Status
            </label>
            <Select
              id="planning-status-filter"
              value={statusFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              options={[
                { label: "All Statuses", value: "All" },
                ...Object.entries(statusLabels).map(([value, label]) => ({
                  label,
                  value,
                })),
              ]}
            />
          </div>
          <div className="u-filter-bar__field">
            <label className="u-filter-bar__label" htmlFor="planning-type-filter">
              Type
            </label>
            <Select
              id="planning-type-filter"
              value={typeFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setTypeFilter(event.target.value as TypeFilter)
              }
              options={[
                { label: "All Types", value: "All" },
                ...Object.entries(typeLabels).map(([value, label]) => ({
                  label,
                  value,
                })),
              ]}
            />
          </div>
        </div>

        <div className="u-overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredProposals}
            rowKey="id"
            striped
            selectionMode="single"
            selectedRowIds={selectedProposalId ? [selectedProposalId] : []}
            onRowClick={(row: ProposalTableRow) => handleSelectProposal(row.id)}
            onSelectionChange={(_, selectedIds) => {
              const nextId = selectedIds[0];
              setSelectedProposalId(
                typeof nextId === "string" ? nextId : nextId != null ? String(nextId) : null
              );
            }}
            emptyMessage="No proposals match your filters."
          />
        </div>
      </Card>

      <ProposalDetailPanel
        open={Boolean(selectedProposal)}
        proposal={selectedProposal}
        relatedAsset={selectedAsset}
        onClose={() => setSelectedProposalId(null)}
      />

      <CreateProposalModal
        open={isCreateModalOpen}
        assets={assetList}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(proposalId) => setSelectedProposalId(proposalId)}
      />
    </Container>
  );
}

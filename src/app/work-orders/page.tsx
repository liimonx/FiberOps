"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Card,
  Container,
  Grid,
  GridCol,
} from "@shohojdhara/atomix";
import {
  useAssets,
  useIncidents,
} from "@/modules/network-map/hooks/useNetworkData";
import {
  useUpdateWorkOrder,
  useWorkOrders,
} from "@/modules/work-orders/hooks/useWorkOrdersData";
import { useTeamSettings } from "@/modules/settings/hooks/useTeamSettings";
import { WorkOrderKanbanBoard } from "@/modules/work-orders/components/WorkOrderKanbanBoard";
import { WorkOrderTable } from "@/modules/work-orders/components/WorkOrderTable";
import { WorkOrderDetailPanel } from "@/modules/work-orders/components/WorkOrderDetailPanel";
import { CreateWorkOrderModal } from "@/modules/work-orders/components/CreateWorkOrderModal";
import {
  WorkOrderFilters,
  type WorkOrderFilterState,
} from "@/modules/work-orders/components/WorkOrderFilters";
import { useWorkOrderDeepLink } from "@/modules/work-orders/hooks/useWorkOrderDeepLink";
import {
  getHighPriorityOpenWorkOrderCount,
  getOpenWorkOrderCount,
  mapWorkOrderToTableRow,
} from "@/lib/operationsViewMappers";
import type { WorkOrderStatus } from "@/types/domain";

type ViewMode = "kanban" | "table";

const defaultFilters: WorkOrderFilterState = {
  search: "",
  status: "All",
  priority: "All",
  workType: "All",
  assigneeId: "All",
};

function WorkOrdersPageContent() {
  const { data: orders, isLoading, isError, refetch } = useWorkOrders();
  const { data: assets } = useAssets();
  const { data: incidents } = useIncidents();
  const { data: teamSettings } = useTeamSettings();
  const { mutateAsync: updateWorkOrder, isPending: isUpdating } = useUpdateWorkOrder();

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<WorkOrderFilterState>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const { incidentId: defaultIncidentId } = useWorkOrderDeepLink({
    onSelect: handleSelect,
  });

  useEffect(() => {
    if (defaultIncidentId) {
      setIsCreateModalOpen(true);
    }
  }, [defaultIncidentId]);

  const orderList = orders ?? [];
  const assetList = assets ?? [];
  const incidentList = incidents ?? [];
  const teamMembers = teamSettings?.members ?? [];

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    teamMembers.forEach((member) => map.set(member.id, member.name));
    return map;
  }, [teamMembers]);

  const filteredOrders = useMemo(() => {
    const query = filters.search.toLowerCase();

    return orderList.filter((order) => {
      const assigneeName = order.assigneeId
        ? memberNameById.get(order.assigneeId) ?? ""
        : "";

      const matchesSearch =
        order.id.toLowerCase().includes(query) ||
        order.title.toLowerCase().includes(query) ||
        assigneeName.toLowerCase().includes(query);

      const matchesStatus =
        filters.status === "All" || order.status === filters.status;
      const matchesPriority =
        filters.priority === "All" || order.priority === filters.priority;
      const matchesType =
        filters.workType === "All" || order.workType === filters.workType;
      const matchesAssignee =
        filters.assigneeId === "All" ||
        (filters.assigneeId === "unassigned"
          ? !order.assigneeId
          : order.assigneeId === filters.assigneeId);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesType &&
        matchesAssignee
      );
    });
  }, [orderList, filters, memberNameById]);

  const tableRows = useMemo(
    () =>
      filteredOrders.map((order) =>
        mapWorkOrderToTableRow(order, order.assigneeId ? memberNameById.get(order.assigneeId) : undefined)
      ),
    [filteredOrders, memberNameById]
  );

  const stats = useMemo(() => {
    const open = getOpenWorkOrderCount(orderList);
    return {
      open,
      highPriority: getHighPriorityOpenWorkOrderCount(orderList),
      unassigned: orderList.filter(
        (order) => order.status !== "done" && !order.assigneeId
      ).length,
      inReview: orderList.filter((order) => order.status === "review").length,
    };
  }, [orderList]);

  const selectedOrder = useMemo(
    () => orderList.find((order) => order.id === selectedId) ?? null,
    [orderList, selectedId]
  );

  const selectedIncident = useMemo(() => {
    if (!selectedOrder?.relatedIncidentId) return null;
    return incidentList.find((inc) => inc.id === selectedOrder.relatedIncidentId) ?? null;
  }, [incidentList, selectedOrder]);

  const selectedAsset = useMemo(() => {
    if (!selectedOrder?.relatedAssetId) return null;
    return assetList.find((asset) => asset.id === selectedOrder.relatedAssetId) ?? null;
  }, [assetList, selectedOrder]);

  const handleStatusChange = async (orderId: string, status: WorkOrderStatus) => {
    setStatusError(null);
    try {
      await updateWorkOrder({ id: orderId, data: { status } });
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : "Failed to update work order status."
      );
    }
  };

  if (isLoading) {
    return (
      <Container className="u-py-4 u-w-100" type="fluid">
        <div className="u-page-header u-mb-6">
          <div>
            <h1 className="u-page-title">Work Orders</h1>
            <p className="u-page-subtitle">Loading work orders...</p>
          </div>
        </div>
        <Grid>
          {Array.from({ length: 5 }).map((_, index) => (
            <GridCol xs={12} sm={6} lg={2} key={index}>
              <div className="u-bg-dark u-p-3 u-rounded u-h-50 u-border u-border-secondary-subtle" />
            </GridCol>
          ))}
        </Grid>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="u-py-4 u-w-100" type="fluid">
        <Callout variant="error" title="Failed to load work orders">
          <p className="u-text-sm u-mb-3">Could not fetch work order data.</p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Callout>
      </Container>
    );
  }

  return (
    <Container className="u-py-4 u-w-100" type="fluid">
      <div className="u-page-header">
        <div>
          <h1 className="u-page-title">Work Orders</h1>
          <p className="u-page-subtitle">
            Drag-and-drop Kanban board for managing field operations.
          </p>
        </div>
        <div className="u-flex u-gap-4 u-flex-wrap">
          <div className="u-flex u-gap-2">
            <Button
              variant={viewMode === "kanban" ? "primary" : "outline-secondary"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === "table" ? "primary" : "outline-secondary"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Table
            </Button>
          </div>
          <Button
            variant="outline-secondary"
            iconName="Funnel"
            onClick={() => setShowFilters((value) => !value)}
          >
            Filter
          </Button>
          <Button
            variant="primary"
            iconName="Plus"
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Order
          </Button>
        </div>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-text-xs u-text-secondary-emphasis u-mb-1">Open</div>
            <div className="u-text-xl u-font-bold">{stats.open}</div>
          </Card>
        </GridCol>
        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-text-xs u-text-secondary-emphasis u-mb-1">
              High priority
            </div>
            <div className="u-text-xl u-font-bold u-text-warning">
              {stats.highPriority}
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-text-xs u-text-secondary-emphasis u-mb-1">
              Unassigned
            </div>
            <div className="u-text-xl u-font-bold">{stats.unassigned}</div>
          </Card>
        </GridCol>
        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-text-xs u-text-secondary-emphasis u-mb-1">
              In review
            </div>
            <div className="u-text-xl u-font-bold">{stats.inReview}</div>
          </Card>
        </GridCol>
      </Grid>

      <Card className="u-mb-6">
        {showFilters && (
          <WorkOrderFilters
            filters={filters}
            assigneeOptions={teamMembers.map((member) => ({
              id: member.id,
              name: member.name,
            }))}
            onChange={setFilters}
          />
        )}

        {statusError && (
          <Callout variant="error" title="Status update failed" className="u-mb-4">
            <p className="u-text-sm u-mb-0">{statusError}</p>
          </Callout>
        )}

        {viewMode === "kanban" ? (
          <WorkOrderKanbanBoard
            orders={filteredOrders}
            selectedId={selectedId}
            onSelect={handleSelect}
            onStatusChange={handleStatusChange}
            isUpdating={isUpdating}
          />
        ) : (
          <WorkOrderTable
            rows={tableRows}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}

      </Card>

      <WorkOrderDetailPanel
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        relatedIncident={selectedIncident}
        relatedAsset={selectedAsset}
        teamMembers={teamMembers}
        onClose={() => setSelectedId(null)}
      />

      <CreateWorkOrderModal
        open={isCreateModalOpen}
        teamMembers={teamMembers}
        incidents={incidentList}
        assets={assetList}
        defaultIncidentId={defaultIncidentId ?? undefined}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(id) => {
          setSelectedId(id);
          setViewMode("kanban");
        }}
      />
    </Container>
  );
}

export default function WorkOrdersPage() {
  return (
    <Suspense fallback={null}>
      <WorkOrdersPageContent />
    </Suspense>
  );
}

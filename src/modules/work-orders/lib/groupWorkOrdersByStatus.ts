import type { WorkOrder, WorkOrderStatus } from "@/types/domain";
import {
  kanbanColumnOrder,
  statusLabels,
} from "@/modules/work-orders/schemas/workOrder.schema";

export type KanbanColumn = {
  status: WorkOrderStatus;
  label: string;
  orders: WorkOrder[];
};

export function groupWorkOrdersByStatus(orders: WorkOrder[]): KanbanColumn[] {
  return kanbanColumnOrder.map((status) => ({
    status,
    label: statusLabels[status],
    orders: orders.filter((order) => order.status === status),
  }));
}

export function getStatusFromColumnLabel(label: string): WorkOrderStatus | undefined {
  const entry = kanbanColumnOrder.find((status) => statusLabels[status] === label);
  return entry;
}

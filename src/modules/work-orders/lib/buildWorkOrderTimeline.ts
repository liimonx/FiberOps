import type { WorkOrder } from "@/types/domain";
import { statusLabels } from "@/modules/work-orders/schemas/workOrder.schema";

export type WorkOrderTimelineEvent = {
  id: string;
  label: string;
  timestamp: string;
  actor?: string;
};

const statusProgression: WorkOrder["status"][] = [
  "new",
  "assigned",
  "in_progress",
  "review",
  "done",
];

export function buildWorkOrderTimeline(
  order: WorkOrder,
  assigneeName?: string
): WorkOrderTimelineEvent[] {
  const currentIndex = statusProgression.indexOf(order.status);
  const actor = assigneeName;

  return statusProgression
    .slice(0, currentIndex + 1)
    .map((status, index) => ({
      id: `${order.id}-${status}`,
      label:
        index === 0
          ? "Work order created"
          : `Moved to ${statusLabels[status]}`,
      timestamp: index === 0 ? order.createdAt : order.updatedAt,
      actor: index > 0 ? actor : undefined,
    }));
}

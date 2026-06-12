"use client";

import { useState } from "react";
import { Badge, Card, Grid, GridCol, Icon } from "@shohojdhara/atomix";
import type { WorkOrder, WorkOrderStatus } from "@/types/domain";
import { priorityLabels, workTypeLabels } from "@/modules/work-orders/schemas/workOrder.schema";
import { groupWorkOrdersByStatus } from "@/modules/work-orders/lib/groupWorkOrdersByStatus";

type WorkOrderKanbanBoardProps = {
  orders: WorkOrder[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onStatusChange: (orderId: string, status: WorkOrderStatus) => void;
  isUpdating?: boolean;
};

function getPriorityBadgeVariant(
  priority: WorkOrder["priority"]
): "error" | "warning" | "success" | "secondary" {
  if (priority === "critical") return "error";
  if (priority === "high") return "warning";
  if (priority === "medium") return "success";
  return "secondary";
}

export function WorkOrderKanbanBoard({
  orders,
  selectedId,
  onSelect,
  onStatusChange,
  isUpdating = false,
}: WorkOrderKanbanBoardProps) {
  const columns = groupWorkOrdersByStatus(orders);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<WorkOrderStatus | null>(null);

  const handleDragStart = (orderId: string) => {
    if (isUpdating) return;
    setDraggedOrderId(orderId);
  };

  const handleDragOver = (e: React.DragEvent, status: WorkOrderStatus) => {
    e.preventDefault();
    if (isUpdating) return;
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: WorkOrderStatus) => {
    e.preventDefault();
    if (!draggedOrderId || isUpdating) return;

    const order = orders.find((item) => item.id === draggedOrderId);
    if (order && order.status !== targetStatus) {
      onStatusChange(draggedOrderId, targetStatus);
    }

    setDraggedOrderId(null);
    setDragOverStatus(null);
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverStatus(null);
  };

  return (
    <Grid className="u-mb-6">
      {columns.map((column) => (
        <GridCol xs={12} sm={6} lg={2} key={column.status} className="u-flex-grow-1">
          <div
            className={`u-bg-dark u-p-3 u-rounded u-h-100 u-border u-transition-all u-duration-200 ${
              dragOverStatus === column.status
                ? "u-border-primary u-bg-primary-subtle"
                : "u-border-secondary-subtle"
            }`}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
            role="list"
            aria-label={`${column.label} work orders`}
          >
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <h3 className="u-font-bold u-text-base">{column.label}</h3>
              <Badge variant="secondary" label={String(column.orders.length)} />
            </div>

            <div className="u-flex u-flex-column u-h-100 u-min-h-100">
              {column.orders.length === 0 ? (
                <div className="u-text-center u-py-8 u-text-secondary-emphasis u-text-sm">
                  Drop tasks here
                </div>
              ) : (
                column.orders.map((order) => {
                  const isSelected = selectedId === order.id;
                  const isDragging = draggedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      className={`u-mb-3 u-cursor-pointer u-transition-all u-duration-200 ${
                        isSelected ? "u-ring-2 u-ring-primary u-rounded" : ""
                      }`}
                      draggable={!isUpdating}
                      onDragStart={() => handleDragStart(order.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onSelect(order.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelect(order.id);
                        }
                      }}
                      role="article"
                      aria-grabbed={isDragging}
                      tabIndex={0}
                    >
                      <Card className="u-border u-border-secondary-subtle u-h-100">
                        <div className="u-flex u-justify-between u-items-start u-mb-2">
                          <Badge
                            variant={getPriorityBadgeVariant(order.priority)}
                            label={priorityLabels[order.priority]}
                          />
                          <Icon name="DotsThree" className="u-text-secondary-emphasis" />
                        </div>
                        <h4 className="u-text-base u-font-bold u-mb-1">{order.title}</h4>
                        <div className="u-flex u-justify-between u-items-center u-mt-4">
                          <span className="u-font-mono u-text-xs u-text-secondary-emphasis">
                            {order.id}
                          </span>
                          <Badge
                            variant="secondary"
                            label={workTypeLabels[order.workType]}
                          />
                        </div>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </GridCol>
      ))}
    </Grid>
  );
}

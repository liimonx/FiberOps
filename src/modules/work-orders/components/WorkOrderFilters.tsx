"use client";

import type { ChangeEvent } from "react";
import { Input, Select } from "@shohojdhara/atomix";
import type { WorkOrderPriority, WorkOrderStatus, WorkOrderType } from "@/types/domain";
import {
  priorityLabels,
  statusLabels,
  workTypeLabels,
  workOrderPriorities,
  workOrderStatuses,
  workOrderTypes,
} from "@/modules/work-orders/schemas/workOrder.schema";

export type WorkOrderFilterState = {
  search: string;
  status: "All" | WorkOrderStatus;
  priority: "All" | WorkOrderPriority;
  workType: "All" | WorkOrderType;
  assigneeId: "All" | "unassigned" | string;
};

type WorkOrderFiltersProps = {
  filters: WorkOrderFilterState;
  assigneeOptions: { id: string; name: string }[];
  onChange: (filters: WorkOrderFilterState) => void;
};

export function WorkOrderFilters({
  filters,
  assigneeOptions,
  onChange,
}: WorkOrderFiltersProps) {
  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: event.target.value });
  };

  return (
    <div className="u-incidents-filters u-mb-4">
      <Input
        placeholder="Search by ID, title, or assignee..."
        value={filters.search}
        onChange={handleSearch}
        fullWidth
      />
      <Select
        id="work-order-status-filter"
        value={filters.status}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange({
            ...filters,
            status: event.target.value as WorkOrderFilterState["status"],
          })
        }
        options={[
          { label: "All statuses", value: "All" },
          ...workOrderStatuses.map((status) => ({
            label: statusLabels[status],
            value: status,
          })),
        ]}
      />
      <Select
        id="work-order-priority-filter"
        value={filters.priority}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange({
            ...filters,
            priority: event.target.value as WorkOrderFilterState["priority"],
          })
        }
        options={[
          { label: "All priorities", value: "All" },
          ...workOrderPriorities.map((priority) => ({
            label: priorityLabels[priority],
            value: priority,
          })),
        ]}
      />
      <Select
        id="work-order-type-filter"
        value={filters.workType}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange({
            ...filters,
            workType: event.target.value as WorkOrderFilterState["workType"],
          })
        }
        options={[
          { label: "All types", value: "All" },
          ...workOrderTypes.map((type) => ({
            label: workTypeLabels[type],
            value: type,
          })),
        ]}
      />
      <Select
        id="work-order-assignee-filter"
        value={filters.assigneeId}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange({ ...filters, assigneeId: event.target.value })
        }
        options={[
          { label: "All assignees", value: "All" },
          { label: "Unassigned", value: "unassigned" },
          ...assigneeOptions.map((member) => ({
            label: member.name,
            value: member.id,
          })),
        ]}
      />
    </div>
  );
}

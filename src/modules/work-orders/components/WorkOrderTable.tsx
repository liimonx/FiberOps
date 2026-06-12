"use client";

import { Badge, DataTable, DataTableColumn } from "@shohojdhara/atomix";
import type { WorkOrderTableRow } from "@/lib/operationsViewMappers";

type WorkOrderTableProps = {
  rows: WorkOrderTableRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function priorityBadgeVariant(
  priority: string
): "error" | "warning" | "success" | "secondary" {
  if (priority === "Critical") return "error";
  if (priority === "High") return "warning";
  if (priority === "Medium") return "success";
  return "secondary";
}

function statusBadgeVariant(
  status: string
): "success" | "primary" | "warning" | "secondary" {
  if (status === "Done") return "success";
  if (status === "In Progress") return "primary";
  if (status === "Review") return "warning";
  return "secondary";
}

export function WorkOrderTable({ rows, selectedId, onSelect }: WorkOrderTableProps) {
  const columns: DataTableColumn[] = [
    {
      key: "id",
      title: "ID",
      render: (val) => <span className="u-font-mono u-text-sm">{val}</span>,
    },
    {
      key: "title",
      title: "Title",
      render: (val) => <span className="u-font-bold">{val}</span>,
    },
    {
      key: "priority",
      title: "Priority",
      render: (val) => (
        <Badge variant={priorityBadgeVariant(val)} label={val} />
      ),
    },
    { key: "type", title: "Type" },
    {
      key: "status",
      title: "Status",
      render: (val) => (
        <Badge variant={statusBadgeVariant(val)} label={val} />
      ),
    },
    { key: "assignee", title: "Assignee" },
    { key: "updated", title: "Updated" },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey="id"
      striped
      selectionMode="single"
      selectedRowIds={selectedId ? [selectedId] : []}
      onRowClick={(row) => onSelect(row.id)}
      onSelectionChange={(_, selectedIds) => {
        const nextId = selectedIds[0];
        onSelect(
          typeof nextId === "string" ? nextId : nextId != null ? String(nextId) : ""
        );
      }}
    />
  );
}

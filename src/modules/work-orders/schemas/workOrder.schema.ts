import { z } from "zod";
import type {
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "@/types/domain";

export const workOrderStatuses = [
  "new",
  "assigned",
  "in_progress",
  "review",
  "done",
] as const satisfies readonly WorkOrderStatus[];

export const workOrderPriorities = [
  "low",
  "medium",
  "high",
  "critical",
] as const satisfies readonly WorkOrderPriority[];

export const workOrderTypes = [
  "survey",
  "audit",
  "repair",
  "upgrade",
  "install",
  "setup",
] as const satisfies readonly WorkOrderType[];

export const kanbanColumnOrder = [
  "new",
  "assigned",
  "in_progress",
  "review",
  "done",
] as const satisfies readonly WorkOrderStatus[];

export const statusLabels: Record<WorkOrderStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export const priorityLabels: Record<WorkOrderPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const workTypeLabels: Record<WorkOrderType, string> = {
  survey: "Survey",
  audit: "Audit",
  repair: "Repair",
  upgrade: "Upgrade",
  install: "Install",
  setup: "Setup",
};

export const createWorkOrderSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  priority: z.enum(workOrderPriorities),
  workType: z.enum(workOrderTypes),
  assigneeId: z.string().trim().optional(),
  relatedIncidentId: z.string().trim().optional(),
  relatedAssetId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CreateWorkOrderFormValues = z.infer<typeof createWorkOrderSchema>;

export const updateWorkOrderSchema = z.object({
  title: z.string().trim().min(3).optional(),
  priority: z.enum(workOrderPriorities).optional(),
  workType: z.enum(workOrderTypes).optional(),
  status: z.enum(workOrderStatuses).optional(),
  assigneeId: z.string().trim().nullable().optional(),
  relatedIncidentId: z.string().trim().nullable().optional(),
  relatedAssetId: z.string().trim().nullable().optional(),
  notes: z.string().trim().optional(),
});

export type UpdateWorkOrderFormValues = z.infer<typeof updateWorkOrderSchema>;

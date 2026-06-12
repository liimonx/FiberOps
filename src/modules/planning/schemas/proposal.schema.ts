import { z } from "zod";
import type { ProposalStatus, ProposalType } from "@/types/domain";

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const planningAreaGeometrySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("circle"),
    center: latLngSchema,
    radiusMeters: z.number().positive("Radius must be greater than 0"),
  }),
  z.object({
    type: z.literal("polygon"),
    coordinates: z.array(latLngSchema).min(3, "Polygon requires at least 3 points"),
  }),
]);

const planningRouteGeometrySchema = z.object({
  waypoints: z.array(latLngSchema).min(2, "Route requires at least 2 waypoints"),
});

const budgetLineItemSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  amountUsd: z.number().nonnegative("Amount must be 0 or greater"),
  notes: z.string().trim().optional(),
});

export const proposalStatuses = [
  "draft",
  "review",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly ProposalStatus[];

export const proposalTypes = [
  "fiber_expansion",
  "splitter_upgrade",
  "pop_build",
  "capacity_upgrade",
  "new_market",
] as const satisfies readonly ProposalType[];

export const createProposalSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().trim().optional(),
  type: z.enum(proposalTypes),
  targetArea: z.string().trim().min(2, "Target area is required"),
  relatedAssetId: z.string().trim().optional(),
  estimatedNewCustomers: z
    .number()
    .int()
    .nonnegative("Must be 0 or greater"),
  currentUtilizationPercent: z.number().min(0).max(100).optional(),
  projectedUtilizationPercent: z
    .number()
    .min(0)
    .max(100, "Utilization cannot exceed 100%"),
  estimatedBudgetUsd: z.number().nonnegative("Budget must be 0 or greater"),
  budgetLineItems: z.array(budgetLineItemSchema).optional(),
  owner: z.string().trim().min(2, "Owner is required"),
  targetStartDate: z.string().trim().optional(),
  targetCompletionDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CreateProposalFormValues = z.infer<typeof createProposalSchema>;

export const updateProposalSchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().optional(),
  type: z.enum(proposalTypes).optional(),
  status: z.enum(proposalStatuses).optional(),
  targetArea: z.string().trim().min(2).optional(),
  relatedAssetId: z.string().trim().optional(),
  estimatedNewCustomers: z.number().int().nonnegative().optional(),
  currentUtilizationPercent: z.number().min(0).max(100).optional(),
  projectedUtilizationPercent: z.number().min(0).max(100).optional(),
  estimatedBudgetUsd: z.number().nonnegative().optional(),
  budgetLineItems: z.array(budgetLineItemSchema).optional(),
  areas: z.array(planningAreaGeometrySchema).optional(),
  routes: z.array(planningRouteGeometrySchema).optional(),
  owner: z.string().trim().min(2).optional(),
  targetStartDate: z.string().trim().optional(),
  targetCompletionDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type UpdateProposalFormValues = z.infer<typeof updateProposalSchema>;

export const statusLabels: Record<ProposalStatus, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const typeLabels: Record<ProposalType, string> = {
  fiber_expansion: "Fiber Expansion",
  splitter_upgrade: "Splitter Upgrade",
  pop_build: "PoP Build",
  capacity_upgrade: "Capacity Upgrade",
  new_market: "New Market",
};

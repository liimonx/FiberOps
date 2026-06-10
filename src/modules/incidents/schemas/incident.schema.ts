import { z } from "zod";
import type { IncidentSeverity, IncidentStatus } from "@/types/domain";

export const incidentSeverities = [
  "low",
  "medium",
  "high",
  "critical",
] as const satisfies readonly IncidentSeverity[];

export const incidentStatuses = [
  "new",
  "investigating",
  "assigned",
  "resolved",
] as const satisfies readonly IncidentStatus[];

export const createIncidentSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  severity: z.enum(incidentSeverities),
  relatedAssetId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CreateIncidentFormValues = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = z.object({
  status: z.enum(incidentStatuses).optional(),
  notes: z.string().trim().optional(),
  technician: z.string().trim().optional(),
  resolutionNotes: z.string().trim().optional(),
});

export type UpdateIncidentFormValues = z.infer<typeof updateIncidentSchema>;

export const resolveIncidentSchema = z.object({
  resolutionNotes: z
    .string()
    .trim()
    .min(10, "Resolution notes must be at least 10 characters"),
});

export type ResolveIncidentFormValues = z.infer<typeof resolveIncidentSchema>;

export const severityLabels: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

import { z } from "zod";

export const reportTypeSchema = z.enum([
  "uptime_summary",
  "asset_inventory",
  "incident_analytics",
]);

export const reportFormatSchema = z.enum(["pdf", "csv"]);

export const reportPeriodSchema = z.enum(["7d", "30d", "90d", "6m", "12m"]);

export const generateReportSchema = z.object({
  type: reportTypeSchema,
  format: reportFormatSchema,
  period: reportPeriodSchema,
});

export type GenerateReportFormValues = z.infer<typeof generateReportSchema>;

export const reportTypeLabels: Record<
  GenerateReportFormValues["type"],
  string
> = {
  uptime_summary: "Uptime Summary",
  asset_inventory: "Asset Inventory",
  incident_analytics: "Incident Analytics",
};

export const reportFormatLabels: Record<
  GenerateReportFormValues["format"],
  string
> = {
  pdf: "PDF",
  csv: "CSV",
};

export const reportPeriodLabels: Record<
  GenerateReportFormValues["period"],
  string
> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
};

export const defaultFormatsByType: Record<
  GenerateReportFormValues["type"],
  GenerateReportFormValues["format"]
> = {
  uptime_summary: "pdf",
  asset_inventory: "csv",
  incident_analytics: "csv",
};

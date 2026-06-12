"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GeneratedReport,
  IncidentAnalytics,
  ReportDownloadPayload,
  ReportsSummary,
  UptimeSummary,
} from "@/types/domain";
import type { GenerateReportFormValues } from "@/modules/reports/schemas/report.schema";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";

export const reportsQueryKeys = {
  all: ["reports"] as const,
  summary: () => [...reportsQueryKeys.all, "summary"] as const,
  incidentAnalytics: (period: string) =>
    [...reportsQueryKeys.all, "incidents", period] as const,
  uptime: (period: string) => [...reportsQueryKeys.all, "uptime", period] as const,
  history: () => [...reportsQueryKeys.all, "history"] as const,
};

async function fetchReportsSummary(): Promise<ReportsSummary> {
  const res = await fetch("/api/reports/summary");
  if (!res.ok) {
    throw new Error("Failed to fetch reports summary");
  }
  return res.json();
}

async function fetchIncidentAnalytics(period: string): Promise<IncidentAnalytics> {
  const res = await fetch(`/api/reports/incidents/analytics?period=${period}`);
  if (!res.ok) {
    throw new Error("Failed to fetch incident analytics");
  }
  return res.json();
}

async function fetchUptimeSummary(period: string): Promise<UptimeSummary> {
  const res = await fetch(`/api/reports/uptime?period=${period}`);
  if (!res.ok) {
    throw new Error("Failed to fetch uptime summary");
  }
  return res.json();
}

async function fetchReportHistory(): Promise<GeneratedReport[]> {
  const res = await fetch("/api/reports/history");
  if (!res.ok) {
    throw new Error("Failed to fetch report history");
  }
  const body = (await res.json()) as { items: GeneratedReport[] };
  return body.items;
}

type GenerateReportResponse = {
  report: GeneratedReport;
  download: ReportDownloadPayload;
};

async function readJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "The server returned an unexpected response. Refresh the page and try again."
    );
  }

  return res.json() as Promise<T>;
}

async function postGenerateReport(
  data: GenerateReportFormValues
): Promise<GenerateReportResponse> {
  const res = await fetch("/api/reports/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to generate report");
  }

  return readJsonResponse<GenerateReportResponse>(res);
}

async function fetchReportDownload(reportId: string): Promise<ReportDownloadPayload> {
  const res = await fetch(`/api/reports/${reportId}/download`);
  if (!res.ok) {
    await parseSettingsError(res, "Failed to download report");
  }
  return readJsonResponse<ReportDownloadPayload>(res);
}

export function useReportsSummary() {
  return useQuery({
    queryKey: reportsQueryKeys.summary(),
    queryFn: fetchReportsSummary,
    staleTime: 30_000,
  });
}

export function useIncidentAnalytics(period: string) {
  return useQuery({
    queryKey: reportsQueryKeys.incidentAnalytics(period),
    queryFn: () => fetchIncidentAnalytics(period),
    staleTime: 30_000,
  });
}

export function useUptimeSummary(period: string) {
  return useQuery({
    queryKey: reportsQueryKeys.uptime(period),
    queryFn: () => fetchUptimeSummary(period),
    staleTime: 30_000,
  });
}

export function useReportHistory() {
  return useQuery({
    queryKey: reportsQueryKeys.history(),
    queryFn: fetchReportHistory,
    staleTime: 15_000,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postGenerateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsQueryKeys.history() });
      queryClient.invalidateQueries({ queryKey: reportsQueryKeys.summary() });
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: fetchReportDownload,
  });
}

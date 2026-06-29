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
import { apiClient } from "@/lib/apiClient";
import { fetchList } from "@/lib/fetchApi";

export const reportsQueryKeys = {
  all: ["reports"] as const,
  summary: () => [...reportsQueryKeys.all, "summary"] as const,
  incidentAnalytics: (period: string) =>
    [...reportsQueryKeys.all, "incidents", period] as const,
  uptime: (period: string) => [...reportsQueryKeys.all, "uptime", period] as const,
  history: () => [...reportsQueryKeys.all, "history"] as const,
};

type GenerateReportResponse = {
  report: GeneratedReport;
  download: ReportDownloadPayload;
};

export function useReportsSummary() {
  return useQuery({
    queryKey: reportsQueryKeys.summary(),
    queryFn: () => apiClient<ReportsSummary>("/api/reports/summary"),
    staleTime: 30_000,
  });
}

export function useIncidentAnalytics(period: string) {
  return useQuery({
    queryKey: reportsQueryKeys.incidentAnalytics(period),
    queryFn: () =>
      apiClient<IncidentAnalytics>(
        `/api/reports/incidents/analytics?period=${encodeURIComponent(period)}`
      ),
    staleTime: 30_000,
  });
}

export function useUptimeSummary(period: string) {
  return useQuery({
    queryKey: reportsQueryKeys.uptime(period),
    queryFn: () =>
      apiClient<UptimeSummary>(
        `/api/reports/uptime?period=${encodeURIComponent(period)}`
      ),
    staleTime: 30_000,
  });
}

export function useReportHistory() {
  return useQuery({
    queryKey: reportsQueryKeys.history(),
    queryFn: () => fetchList<GeneratedReport>("/api/reports/history"),
    staleTime: 15_000,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateReportFormValues) =>
      apiClient<GenerateReportResponse>("/api/reports/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportsQueryKeys.history() });
      queryClient.invalidateQueries({ queryKey: reportsQueryKeys.summary() });
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (reportId: string) =>
      apiClient<ReportDownloadPayload>(`/api/reports/${reportId}/download`),
  });
}

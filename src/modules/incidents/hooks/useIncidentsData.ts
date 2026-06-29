"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Incident } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import type {
  CreateIncidentFormValues,
  ResolveIncidentFormValues,
  UpdateIncidentFormValues,
} from "@/modules/incidents/schemas/incident.schema";
import { apiClient } from "@/lib/apiClient";
import { fetchList } from "@/lib/fetchApi";

async function fetchIncident(id: string): Promise<Incident> {
  return apiClient<Incident>(`/api/incidents/${id}`);
}

async function postIncident(data: CreateIncidentFormValues): Promise<Incident> {
  return apiClient<Incident>("/api/incidents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function patchIncident(
  id: string,
  data: UpdateIncidentFormValues
): Promise<Incident> {
  return apiClient<Incident>(`/api/incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

async function patchResolveIncident(
  id: string,
  data: ResolveIncidentFormValues
): Promise<Incident> {
  return apiClient<Incident>(`/api/incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...data, status: "resolved" }),
  });
}

export function useIncidents() {
  return useQuery({
    queryKey: networkQueryKeys.incidents.list(),
    queryFn: () => fetchList<Incident>("/api/incidents"),
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchInterval: 30_000,
  });
}

export function useIncident(id: string | null) {
  return useQuery({
    queryKey: networkQueryKeys.incidents.detail(id ?? ""),
    queryFn: () => fetchIncident(id as string),
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.incidents.all });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidentFormValues }) =>
      patchIncident(id, data),
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.incidents.all });
      queryClient.setQueryData(
        networkQueryKeys.incidents.detail(incident.id),
        incident
      );
    },
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResolveIncidentFormValues }) =>
      patchResolveIncident(id, data),
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.incidents.all });
      queryClient.setQueryData(
        networkQueryKeys.incidents.detail(incident.id),
        incident
      );
    },
  });
}

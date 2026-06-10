"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Incident } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";
import type {
  CreateIncidentFormValues,
  ResolveIncidentFormValues,
  UpdateIncidentFormValues,
} from "@/modules/incidents/schemas/incident.schema";

async function fetchList<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const body = (await res.json()) as { items: T[] };
  return body.items;
}

async function fetchIncident(id: string): Promise<Incident> {
  const res = await fetch(`/api/incidents/${id}`);
  if (!res.ok) {
    await parseSettingsError(res, "Failed to fetch incident");
  }
  return res.json();
}

async function postIncident(data: CreateIncidentFormValues): Promise<Incident> {
  const res = await fetch("/api/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to create incident");
  }

  return res.json();
}

async function patchIncident(
  id: string,
  data: UpdateIncidentFormValues
): Promise<Incident> {
  const res = await fetch(`/api/incidents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to update incident");
  }

  return res.json();
}

async function patchResolveIncident(
  id: string,
  data: ResolveIncidentFormValues
): Promise<Incident> {
  const res = await fetch(`/api/incidents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, status: "resolved" }),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to resolve incident");
  }

  return res.json();
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

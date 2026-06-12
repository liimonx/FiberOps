"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlanningProposal } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";
import type {
  CreateProposalFormValues,
  UpdateProposalFormValues,
} from "@/modules/planning/schemas/proposal.schema";

async function fetchList<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const body = (await res.json()) as { items: T[] };
  return body.items;
}

async function fetchPlanningProposal(id: string): Promise<PlanningProposal> {
  const res = await fetch(`/api/planning/proposals/${id}`);
  if (!res.ok) {
    await parseSettingsError(res, "Failed to fetch planning proposal");
  }
  return res.json();
}

async function postPlanningProposal(
  data: CreateProposalFormValues
): Promise<PlanningProposal> {
  const res = await fetch("/api/planning/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to create planning proposal");
  }

  return res.json();
}

async function patchPlanningProposal(
  id: string,
  data: UpdateProposalFormValues
): Promise<PlanningProposal> {
  const res = await fetch(`/api/planning/proposals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to update planning proposal");
  }

  return res.json();
}

export function usePlanningProposals() {
  return useQuery({
    queryKey: networkQueryKeys.proposals.list(),
    queryFn: () => fetchList<PlanningProposal>("/api/planning/proposals"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function usePlanningProposal(id: string | null) {
  return useQuery({
    queryKey: networkQueryKeys.proposals.detail(id ?? ""),
    queryFn: () => fetchPlanningProposal(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useCreatePlanningProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postPlanningProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: networkQueryKeys.proposals.all,
      });
    },
  });
}

export function useUpdatePlanningProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProposalFormValues;
    }) => patchPlanningProposal(id, data),
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({
        queryKey: networkQueryKeys.proposals.all,
      });
      queryClient.setQueryData(
        networkQueryKeys.proposals.detail(proposal.id),
        proposal
      );
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlanningProposal } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import type {
  CreateProposalFormValues,
  UpdateProposalFormValues,
} from "@/modules/planning/schemas/proposal.schema";
import { apiClient } from "@/lib/apiClient";
import { fetchList } from "@/lib/fetchApi";

async function fetchPlanningProposal(id: string): Promise<PlanningProposal> {
  return apiClient<PlanningProposal>(`/api/planning/proposals/${id}`);
}

async function postPlanningProposal(
  data: CreateProposalFormValues
): Promise<PlanningProposal> {
  return apiClient<PlanningProposal>("/api/planning/proposals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function patchPlanningProposal(
  id: string,
  data: UpdateProposalFormValues
): Promise<PlanningProposal> {
  return apiClient<PlanningProposal>(`/api/planning/proposals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
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

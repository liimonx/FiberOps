"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkOrder } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";
import type {
  CreateWorkOrderFormValues,
  UpdateWorkOrderFormValues,
} from "@/modules/work-orders/schemas/workOrder.schema";

async function fetchList<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const body = (await res.json()) as { items: T[] };
  return body.items;
}

async function fetchWorkOrder(id: string): Promise<WorkOrder> {
  const res = await fetch(`/api/work-orders/${id}`);
  if (!res.ok) {
    await parseSettingsError(res, "Failed to fetch work order");
  }
  return res.json();
}

async function postWorkOrder(data: CreateWorkOrderFormValues): Promise<WorkOrder> {
  const res = await fetch("/api/work-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to create work order");
  }

  return res.json();
}

async function patchWorkOrder(
  id: string,
  data: UpdateWorkOrderFormValues
): Promise<WorkOrder> {
  const res = await fetch(`/api/work-orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to update work order");
  }

  return res.json();
}

export function useWorkOrders() {
  return useQuery({
    queryKey: networkQueryKeys.workOrders.list(),
    queryFn: () => fetchList<WorkOrder>("/api/work-orders"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchInterval: 30_000,
  });
}

export function useWorkOrder(id: string | null) {
  return useQuery({
    queryKey: networkQueryKeys.workOrders.detail(id ?? ""),
    queryFn: () => fetchWorkOrder(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.workOrders.all });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkOrderFormValues }) =>
      patchWorkOrder(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: networkQueryKeys.workOrders.all });

      const previousList = queryClient.getQueryData<WorkOrder[]>(
        networkQueryKeys.workOrders.list()
      );

      if (previousList) {
        queryClient.setQueryData<WorkOrder[]>(
          networkQueryKeys.workOrders.list(),
          previousList.map((order) => {
            if (order.id !== id) return order;

            return {
              ...order,
              ...data,
              assigneeId:
                data.assigneeId === null
                  ? undefined
                  : data.assigneeId !== undefined
                    ? data.assigneeId || undefined
                    : order.assigneeId,
              relatedIncidentId:
                data.relatedIncidentId === null
                  ? undefined
                  : data.relatedIncidentId !== undefined
                    ? data.relatedIncidentId || undefined
                    : order.relatedIncidentId,
              relatedAssetId:
                data.relatedAssetId === null
                  ? undefined
                  : data.relatedAssetId !== undefined
                    ? data.relatedAssetId || undefined
                    : order.relatedAssetId,
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }

      return { previousList };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          networkQueryKeys.workOrders.list(),
          context.previousList
        );
      }
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.workOrders.all });
      queryClient.setQueryData(networkQueryKeys.workOrders.detail(order.id), order);
    },
  });
}

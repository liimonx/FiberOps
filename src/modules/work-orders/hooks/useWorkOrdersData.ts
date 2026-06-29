"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkOrder } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import type {
  CreateWorkOrderFormValues,
  UpdateWorkOrderFormValues,
} from "@/modules/work-orders/schemas/workOrder.schema";
import { apiClient } from "@/lib/apiClient";
import { fetchList } from "@/lib/fetchApi";

async function fetchWorkOrder(id: string): Promise<WorkOrder> {
  return apiClient<WorkOrder>(`/api/work-orders/${id}`);
}

async function postWorkOrder(data: CreateWorkOrderFormValues): Promise<WorkOrder> {
  return apiClient<WorkOrder>("/api/work-orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function patchWorkOrder(
  id: string,
  data: UpdateWorkOrderFormValues
): Promise<WorkOrder> {
  return apiClient<WorkOrder>(`/api/work-orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
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

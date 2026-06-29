"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Customer } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import type {
  CreateCustomerFormValues,
  UpdateCustomerFormValues,
} from "@/modules/customers/schemas/customer.schema";
import { apiClient } from "@/lib/apiClient";
import { fetchList } from "@/lib/fetchApi";

async function fetchCustomer(id: string): Promise<Customer> {
  try {
    return await apiClient<Customer>(`/api/customers/${id}`);
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to fetch customer");
  }
}

async function postCustomer(data: CreateCustomerFormValues): Promise<Customer> {
  try {
    return await apiClient<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Failed to create customer");
  }
}

async function patchCustomer(
  id: string,
  data: UpdateCustomerFormValues
): Promise<Customer> {
  try {
    return await apiClient<Customer>(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Failed to update customer");
  }
}

export function useCustomers() {
  return useQuery({
    queryKey: networkQueryKeys.customers.list(),
    queryFn: () => fetchList<Customer>("/api/customers"),
    staleTime: 5 * 60_000,
    gcTime: 20 * 60_000,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: networkQueryKeys.customers.detail(id ?? ""),
    queryFn: () => fetchCustomer(id as string),
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.customers.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerFormValues }) =>
      patchCustomer(id, data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.customers.all });
      queryClient.setQueryData(
        networkQueryKeys.customers.detail(customer.id),
        customer
      );
    },
  });
}

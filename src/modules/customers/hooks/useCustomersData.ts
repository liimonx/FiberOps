"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Customer } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";
import type {
  CreateCustomerFormValues,
  UpdateCustomerFormValues,
} from "@/modules/customers/schemas/customer.schema";

async function fetchList<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const body = (await res.json()) as { items: T[] };
  return body.items;
}

async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) {
    await parseSettingsError(res, "Failed to fetch customer");
  }
  return res.json();
}

async function postCustomer(data: CreateCustomerFormValues): Promise<Customer> {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to create customer");
  }

  return res.json();
}

async function patchCustomer(
  id: string,
  data: UpdateCustomerFormValues
): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to update customer");
  }

  return res.json();
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

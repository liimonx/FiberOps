import { z } from "zod";
import type { BillingStatus, CustomerStatus } from "@/types/domain";

export const customerStatuses = [
  "online",
  "offline",
  "unstable",
] as const satisfies readonly CustomerStatus[];

export const billingStatuses = [
  "paid",
  "overdue",
  "unpaid",
] as const satisfies readonly BillingStatus[];

export const customerPlans = [
  "Fiber 50Mbps",
  "Fiber 100Mbps",
  "Fiber 200Mbps",
  "Fiber 500Mbps",
  "Fiber 1Gbps",
] as const;

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  plan: z.enum(customerPlans),
  status: z.enum(customerStatuses),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  relatedOnuId: z.string().trim().optional(),
  location: locationSchema.optional(),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(2).optional(),
  plan: z.enum(customerPlans).optional(),
  status: z.enum(customerStatuses).optional(),
  billingStatus: z.enum(billingStatuses).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  relatedOnuId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  location: locationSchema.optional(),
});

export type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;

export const statusLabels: Record<CustomerStatus, string> = {
  online: "Online",
  offline: "Offline",
  unstable: "Unstable",
};

export const billingLabels: Record<BillingStatus, string> = {
  paid: "Paid",
  overdue: "Overdue",
  unpaid: "Unpaid",
};

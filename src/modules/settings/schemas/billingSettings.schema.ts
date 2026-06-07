import { z } from "zod";

export const billingCurrencies = ["USD", "EUR", "GBP", "CAD"] as const;

export const invoiceDeliveryOptions = ["email", "portal"] as const;

export const billingSettingsSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, "Legal name must be at least 2 characters")
    .max(120, "Legal name must be at most 120 characters"),
  billingEmail: z.string().trim().email("Enter a valid billing email address"),
  currency: z.enum(billingCurrencies),
  taxId: z
    .string()
    .trim()
    .max(32, "Tax ID must be at most 32 characters"),
  invoiceDelivery: z.enum(invoiceDeliveryOptions),
});

export type BillingSettingsFormValues = z.infer<typeof billingSettingsSchema>;

import { z } from "zod";

export const organizationSettingsSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters"),
  supportEmail: z.string().email("Enter a valid support email address"),
});

export type OrganizationSettingsFormValues = z.infer<
  typeof organizationSettingsSchema
>;

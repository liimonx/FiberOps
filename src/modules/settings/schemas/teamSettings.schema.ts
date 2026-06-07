import { z } from "zod";
import type { TeamRole } from "@/types/domain";

export const teamRoles = ["admin", "operator", "viewer"] as const satisfies readonly TeamRole[];

export const teamMemberUpdateSchema = z.object({
  role: z.enum(teamRoles),
});

export type TeamMemberUpdateFormValues = z.infer<typeof teamMemberUpdateSchema>;

export const teamInviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(teamRoles),
});

export type TeamInviteFormValues = z.infer<typeof teamInviteSchema>;

export const roleLabels: Record<TeamRole, string> = {
  admin: "Admin",
  operator: "Operator",
  viewer: "Viewer",
};

export const roleDescriptions: Record<TeamRole, string> = {
  admin: "Full system access including settings and billing",
  operator: "Manage network operations, incidents, and work orders",
  viewer: "Read-only access to dashboards and reports",
};

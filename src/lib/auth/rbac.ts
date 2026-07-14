import type { AuthUser } from "@/types/auth";
import type { TeamRole } from "@/types/domain";

export const SETTINGS_MIN_ROLE: TeamRole = "admin";

export function isAdmin(role: TeamRole | null | undefined): boolean {
  return role === "admin";
}

export function canAccessSettings(
  user: Pick<AuthUser, "role"> | null | undefined
): boolean {
  return isAdmin(user?.role);
}

export function roleAtLeast(
  role: TeamRole | null | undefined,
  minimum: TeamRole
): boolean {
  if (!role) return false;
  const rank: Record<TeamRole, number> = {
    viewer: 1,
    operator: 2,
    admin: 3,
  };
  return rank[role] >= rank[minimum];
}

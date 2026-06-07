import type { OrganizationSettings } from "@/types/domain";

export const defaultOrganizationSettings: OrganizationSettings = {
  organizationName: "BCN FiberOps",
  supportEmail: "support@bcn-fiberops.com",
};

let organizationSettings: OrganizationSettings = {
  ...defaultOrganizationSettings,
};

export function getOrganizationSettings(): OrganizationSettings {
  return { ...organizationSettings };
}

export function setOrganizationSettings(
  data: OrganizationSettings
): OrganizationSettings {
  organizationSettings = { ...data };
  return getOrganizationSettings();
}

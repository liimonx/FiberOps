import type { PhosphorIconsType } from "@shohojdhara/atomix";

export type AppColor = "primary" | "error" | "success" | "warning";

export type NavigationItem = {
  href: string;
  label: string;
  icon: PhosphorIconsType;
  description: string;
  color: AppColor;
  showInSidebar: boolean;
  showInLauncher: boolean;
  launcherGroup?: "core" | "management";
  /** When set, item is only shown to users with this role or higher. */
  minRole?: "viewer" | "operator" | "admin";
};

export const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
    icon: "House",
    description: "Operations center overview and quick links.",
    color: "primary",
    showInSidebar: true,
    showInLauncher: false,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "SquaresFour",
    description: "Charts, outage feed, and recent work orders at a glance.",
    color: "primary",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "management",
  },
  {
    href: "/network-map",
    label: "Network Map",
    icon: "MapPin",
    description:
      "Explore routes, nodes, and service areas with live geographic context.",
    color: "primary",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "core",
  },
  {
    href: "/assets",
    label: "Assets",
    icon: "Package",
    description:
      "Inspect cabinets, splitters, ONTs, and passive plant inventory.",
    color: "warning",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "core",
  },
  {
    href: "/customers",
    label: "Customers",
    icon: "Users",
    description: "Subscriber accounts, service plans, and signal health.",
    color: "primary",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "management",
  },
  {
    href: "/incidents",
    label: "Incidents",
    icon: "Warning",
    description:
      "Track outages, degradations, and restoration status across the network.",
    color: "error",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "core",
  },
  {
    href: "/work-orders",
    label: "Work Orders",
    icon: "Clipboard",
    description:
      "Manage installation, repair, and maintenance tasks for field teams.",
    color: "success",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "core",
  },
  {
    href: "/planning",
    label: "Planning",
    icon: "Calendar",
    description: "Capacity planning, build proposals, and expansion forecasts.",
    color: "success",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "management",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "ChartBar",
    description: "Analytics, uptime summaries, and exportable reports.",
    color: "warning",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "management",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: "Gear",
    description: "Team, integrations, billing, and organization preferences.",
    color: "primary",
    showInSidebar: true,
    showInLauncher: true,
    launcherGroup: "management",
    minRole: "admin",
  },
];

export const sidebarNav = navigationItems.filter((item) => item.showInSidebar);

export type LauncherItem = NavigationItem & {
  badge?: string | number;
};

export function filterNavigationByRole(
  items: NavigationItem[],
  role: "admin" | "operator" | "viewer" | null | undefined
): NavigationItem[] {
  const rank = { viewer: 1, operator: 2, admin: 3 } as const;
  return items.filter((item) => {
    if (!item.minRole) return true;
    if (!role) return false;
    return rank[role] >= rank[item.minRole];
  });
}

export function getLauncherItems(
  badges: Partial<Record<string, string | number>> = {},
  role?: "admin" | "operator" | "viewer" | null
): LauncherItem[] {
  return filterNavigationByRole(
    navigationItems.filter((item) => item.showInLauncher),
    role
  ).map((item) => ({
    ...item,
    badge: badges[item.href],
  }));
}

export function getLauncherItemsByGroup(
  group: "core" | "management",
  badges: Partial<Record<string, string | number>> = {},
  role?: "admin" | "operator" | "viewer" | null
): LauncherItem[] {
  return getLauncherItems(badges, role).filter(
    (item) => item.launcherGroup === group
  );
}

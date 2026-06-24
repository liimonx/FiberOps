import type { PhosphorIconsType } from "@shohojdhara/atomix";
import { MAP_TOOLS } from "@/modules/network-map/constants/mapTools";

export type HelpShortcut = {
  keys: string;
  label: string;
  context?: string;
};

export type HelpTopic = {
  icon: PhosphorIconsType;
  title: string;
  description: string;
};

export type ModuleHelpGuide = {
  href: string;
  label: string;
  icon: PhosphorIconsType;
  color: "primary" | "error" | "success" | "warning";
  summary: string;
  topics: HelpTopic[];
};

export const APP_SHORTCUTS: HelpShortcut[] = [
  { keys: "⌘/Ctrl + B", label: "Toggle sidebar", context: "Global" },
  { keys: "⌘K", label: "Quick search", context: "Global" },
  { keys: "?", label: "Show shortcuts panel", context: "Sidebar footer" },
  { keys: "Esc", label: "Close open panel or modal", context: "Global" },
];

export const MAP_SHORTCUTS: HelpShortcut[] = [
  { keys: "/", label: "Focus asset search", context: "Network map" },
  ...MAP_TOOLS.filter((tool) => tool.shortcut).map((tool) => ({
    keys: tool.shortcut!,
    label: tool.label,
    context: "Network map",
  })),
];

export const GETTING_STARTED_TOPICS: HelpTopic[] = [
  {
    icon: "House",
    title: "Home operations center",
    description:
      "Start on Home for live metrics, the application launcher, and a recent activity feed. Use Refresh data to pull the latest network state.",
  },
  {
    icon: "SquaresFour",
    title: "Dashboard analytics",
    description:
      "Open Dashboard for KPI cards, outage feed, fiber usage charts, signal health visualizations, and recent work orders in one view.",
  },
  {
    icon: "List",
    title: "Sidebar navigation",
    description:
      "The sidebar lists every module. Collapse it with the toggle control or ⌘/Ctrl + B when you need more map or table space.",
  },
  {
    icon: "AppWindow",
    title: "Application launcher",
    description:
      "Home groups launcher cards into Core operations and Management & analytics, with badge counts for active incidents and work orders.",
  },
];

export const MODULE_GUIDES: Record<"core" | "management", ModuleHelpGuide[]> = {
  core: [
    {
      href: "/network-map",
      label: "Network Map",
      icon: "MapPin",
      color: "primary",
      summary:
        "Full-viewport GIS canvas for fiber routes, nodes, and service areas with live geographic context.",
      topics: [
        {
          icon: "Stack",
          title: "Layer controls",
          description:
            "Toggle infrastructure layers and review per-layer statistics, including alert counts.",
        },
        {
          icon: "MagnifyingGlass",
          title: "Asset search",
          description:
            "Find assets by ID, type, or location. Press / to focus search while the map is open.",
        },
        {
          icon: "GitCommit",
          title: "Trace & measure",
          description:
            "Trace connection paths between nodes or measure distances for route planning.",
        },
        {
          icon: "Fire",
          title: "Heatmap & impairment",
          description:
            "Overlay utilization density or simulate outage blast radius for impact analysis.",
        },
      ],
    },
    {
      href: "/assets",
      label: "Assets",
      icon: "Package",
      color: "warning",
      summary:
        "Inspect cabinets, splitters, ONTs, and passive plant inventory across your network.",
      topics: [
        {
          icon: "Package",
          title: "Inventory browser",
          description:
            "Filter and open asset detail panels with specifications, status, and location context.",
        },
        {
          icon: "PlusCircle",
          title: "Asset registration",
          description:
            "Register new equipment through the guided modal with validated metadata fields.",
        },
        {
          icon: "Calendar",
          title: "Maintenance timeline",
          description:
            "Review maintenance history and upcoming service windows for each asset.",
        },
        {
          icon: "Graph",
          title: "Connection graphs",
          description:
            "Visualize upstream and downstream links to understand capacity and signal health.",
        },
      ],
    },
    {
      href: "/incidents",
      label: "Incidents",
      icon: "Warning",
      color: "error",
      summary:
        "Track outages, degradations, and restoration progress across the network.",
      topics: [
        {
          icon: "Warning",
          title: "Report & triage",
          description:
            "Create incidents from the page header and filter the queue by severity or status.",
        },
        {
          icon: "MapTrifold",
          title: "Live map preview",
          description:
            "Select incidents on the embedded map to correlate geographic impact with details.",
        },
        {
          icon: "Timer",
          title: "Status timelines",
          description:
            "Follow acknowledgement, dispatch, and resolution events in chronological order.",
        },
        {
          icon: "Clipboard",
          title: "Work order links",
          description:
            "Spin up related field work directly from an incident with deep-linked context.",
        },
      ],
    },
    {
      href: "/work-orders",
      label: "Work Orders",
      icon: "Clipboard",
      color: "success",
      summary:
        "Coordinate installation, repair, and maintenance tasks for field teams.",
      topics: [
        {
          icon: "Kanban",
          title: "Kanban board",
          description:
            "Drag cards between status columns to update progress at a glance.",
        },
        {
          icon: "Table",
          title: "Table view",
          description:
            "Switch to the table for sorting, filtering, and bulk review of assignments.",
        },
        {
          icon: "Funnel",
          title: "Filters",
          description:
            "Narrow by status, priority, work type, or assignee to focus dispatch queues.",
        },
        {
          icon: "Link",
          title: "Cross-references",
          description:
            "Open linked incidents and assets from a work order for full operational context.",
        },
      ],
    },
  ],
  management: [
    {
      href: "/customers",
      label: "Customers",
      icon: "Users",
      color: "primary",
      summary:
        "Manage subscriber accounts, service plans, and connection health in one place.",
      topics: [
        {
          icon: "User",
          title: "Customer profiles",
          description:
            "Search subscribers and review plans, installation dates, and contact details.",
        },
        {
          icon: "WifiHigh",
          title: "Signal health",
          description:
            "Monitor live signal metrics and spot degradations before they become outages.",
        },
        {
          icon: "Path",
          title: "Connection tracing",
          description:
            "Follow the path from premises equipment to backbone infrastructure.",
        },
        {
          icon: "ClockCounterClockwise",
          title: "Incident history",
          description:
            "Review prior service events to identify recurring trouble patterns.",
        },
      ],
    },
    {
      href: "/planning",
      label: "Planning",
      icon: "Calendar",
      color: "success",
      summary:
        "Build capacity plans, expansion proposals, and forecasted growth scenarios.",
      topics: [
        {
          icon: "FileText",
          title: "Expansion proposals",
          description:
            "Create proposals with scope, cost estimates, and projected subscriber impact.",
        },
        {
          icon: "CurrencyDollar",
          title: "Budget tracking",
          description:
            "Compare planned spend against forecasted totals as proposals evolve.",
        },
        {
          icon: "ChartLine",
          title: "Capacity forecasts",
          description:
            "Review forecast charts to validate timing for new builds and upgrades.",
        },
        {
          icon: "Pen",
          title: "Map drawing mode",
          description:
            "Jump to the network map to sketch proposed routes and service areas.",
        },
      ],
    },
    {
      href: "/reports",
      label: "Reports",
      icon: "ChartBar",
      color: "warning",
      summary:
        "Generate analytics, uptime summaries, and exportable operational reports.",
      topics: [
        {
          icon: "SquaresFour",
          title: "Summary dashboards",
          description:
            "Review network-wide KPIs including uptime, incidents, and subscriber trends.",
        },
        {
          icon: "ChartLine",
          title: "Incident analytics",
          description:
            "Analyze incident volume, severity mix, and resolution performance over time.",
        },
        {
          icon: "ChartBar",
          title: "Uptime metrics",
          description:
            "Track SLA-oriented availability with historical period comparisons.",
        },
        {
          icon: "Download",
          title: "Report exports",
          description:
            "Generate downloadable reports and review export history for audit trails.",
        },
      ],
    },
    {
      href: "/settings",
      label: "Settings",
      icon: "Gear",
      color: "primary",
      summary:
        "Configure organization preferences, integrations, billing, and team access.",
      topics: [
        {
          icon: "Gear",
          title: "General",
          description:
            "Set organization profile details and global operational preferences.",
        },
        {
          icon: "PlugsConnected",
          title: "Integrations",
          description:
            "Connect monitoring, ticketing, and webhook endpoints to external systems.",
        },
        {
          icon: "CreditCard",
          title: "Billing",
          description:
            "Manage subscription details, invoicing contacts, and payment preferences.",
        },
        {
          icon: "UsersThree",
          title: "Team & access",
          description:
            "Invite members, assign roles, and control who can access each module.",
        },
      ],
    },
  ],
};

export const TROUBLESHOOTING_TOPICS: HelpTopic[] = [
  {
    icon: "ArrowsClockwise",
    title: "Stale data on Home or Dashboard",
    description:
      "Use Refresh data on Home or reload the page. In development, MSW serves mock API responses from Next.js route handlers.",
  },
  {
    icon: "MapPin",
    title: "Map not loading",
    description:
      "Confirm NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is set in .env.local and restart the dev server after changes.",
  },
  {
    icon: "DeviceMobile",
    title: "Browser compatibility",
    description:
      "FiberOps targets modern Chromium, Firefox, and Edge releases. Enable hardware acceleration for large map layers.",
  },
  {
    icon: "Rocket",
    title: "Map performance",
    description:
      "Hide unused layers, zoom to a service area, and close inspector panels when working with dense infrastructure.",
  },
];

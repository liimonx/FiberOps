/**
 * Resolves Atomix CSS custom properties for Mapbox / canvas contexts
 * that cannot consume `var(--*)` in paint properties at parse time.
 */
function readCssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Semantic colors from the active Atomix theme. */
export function getThemeColors() {
  return {
    primary: readCssVar("--atomix-primary", "#06b6d4"),
    secondary: readCssVar("--atomix-secondary", "#9333ea"),
    success: readCssVar("--atomix-success", "#10b981"),
    warning: readCssVar("--atomix-warning", "#f59e0b"),
    error: readCssVar("--atomix-error", "#ef4444"),
    muted: readCssVar("--atomix-secondary-text-emphasis", "#6b7280"),
    white: readCssVar("--atomix-white", "#ffffff"),
  };
}

/** Incident severity → theme semantic color (for DOM marker elements). */
export const incidentSeverityColors = {
  critical: "var(--atomix-error)",
  high: "var(--atomix-warning)",
  medium: "var(--atomix-warning)",
  low: "var(--atomix-secondary-text-emphasis)",
} as const;

/** Customer connectivity status → theme semantic color. */
export const customerStatusColors = {
  online: "var(--atomix-success)",
  unstable: "var(--atomix-warning)",
  offline: "var(--atomix-error)",
} as const;

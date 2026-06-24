import type { Asset } from "@/types/domain";
import { mapAssetToTableRow } from "@/lib/operationsViewMappers";

export type AssetMaintenanceEvent = {
  id: string;
  label: string;
  date: string;
  description: string;
};

function stableIndex(seed: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % modulo;
  }
  return hash;
}

function offsetDate(isoDate: string, daysBack: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().slice(0, 10);
}

const maintenanceTemplates = [
  {
    label: "Routine Inspection",
    descriptions: [
      "Checked signal attenuation and cleaned optical connectors.",
      "Verified pole hardware and splice enclosure seals.",
      "Inspected drop cable tension and weatherproofing.",
    ],
  },
  {
    label: "Firmware Update",
    descriptions: [
      "Updated to latest stable release to patch security vulnerability.",
      "Applied vendor-recommended firmware for improved stability.",
      "Rolled out configuration profile v3.2 across access layer.",
    ],
  },
  {
    label: "Preventive Maintenance",
    descriptions: [
      "Replaced worn weather seals on junction enclosure.",
      "Tightened strand hardware and re-labeled fiber pairs.",
      "Cleared vegetation around pole line-of-sight path.",
    ],
  },
] as const;

export function buildAssetMaintenanceTimeline(asset: Asset): AssetMaintenanceEvent[] {
  const { lastMaintenance } = mapAssetToTableRow(asset);
  const primaryTemplate = maintenanceTemplates[stableIndex(asset.id, maintenanceTemplates.length)];
  const secondaryTemplate =
    maintenanceTemplates[(stableIndex(asset.id, maintenanceTemplates.length) + 1) %
      maintenanceTemplates.length];

  return [
    {
      id: `${asset.id}-maint-1`,
      label: primaryTemplate.label,
      date: lastMaintenance,
      description:
        primaryTemplate.descriptions[
          stableIndex(asset.id, primaryTemplate.descriptions.length)
        ],
    },
    {
      id: `${asset.id}-maint-2`,
      label: secondaryTemplate.label,
      date: offsetDate(lastMaintenance, 45 + stableIndex(asset.id.slice(2), 60)),
      description:
        secondaryTemplate.descriptions[
          stableIndex(asset.id.slice(1), secondaryTemplate.descriptions.length)
        ],
    },
  ];
}

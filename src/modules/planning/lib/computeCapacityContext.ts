import type { Asset, PlanningProposal } from "@/types/domain";

export type CapacityContext = {
  assetName: string | null;
  currentUtilization: number | null;
  projectedUtilization: number;
  estimatedNewCustomers: number;
  headroomAfterBuild: number | null;
};

function stableUtilization(assetId: string): number {
  let hash = 0;
  for (let i = 0; i < assetId.length; i += 1) {
    hash = (hash + assetId.charCodeAt(i) * (i + 1)) % 100;
  }
  return 45 + (hash % 45);
}

export function computeCapacityContext(
  proposal: PlanningProposal,
  relatedAsset: Asset | null
): CapacityContext {
  const currentUtilization =
    proposal.currentUtilizationPercent ??
    (relatedAsset ? stableUtilization(relatedAsset.id) : null);

  const projectedUtilization = proposal.projectedUtilizationPercent;
  const headroomAfterBuild =
    currentUtilization !== null
      ? Math.max(0, 100 - projectedUtilization)
      : null;

  return {
    assetName: relatedAsset?.name ?? null,
    currentUtilization,
    projectedUtilization,
    estimatedNewCustomers: proposal.estimatedNewCustomers,
    headroomAfterBuild,
  };
}

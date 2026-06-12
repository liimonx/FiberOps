export const PLANNING_MAP_QUERY_PARAM = "proposal";
export const PLANNING_MAP_EDIT_PARAM = "edit";

export function getPlanningMapUrl(
  proposalId: string,
  options: { edit?: boolean } = {}
): string {
  const params = new URLSearchParams({
    [PLANNING_MAP_QUERY_PARAM]: proposalId,
  });

  if (options.edit) {
    params.set(PLANNING_MAP_EDIT_PARAM, "1");
  }

  return `/network-map?${params.toString()}`;
}

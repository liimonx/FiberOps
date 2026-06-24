import { NODE_TYPE_ICONS } from "@/modules/network-map/constants";
import { NetworkNodeType } from "@/modules/network-map/types";
import type { AssetKind } from "@/types/domain";
import type { PhosphorIconsType } from "@shohojdhara/atomix";

const kindToNodeType: Record<AssetKind, NetworkNodeType> = {
  pole: NetworkNodeType.POLE,
  junction_box: NetworkNodeType.JUNCTION_BOX,
  splitter: NetworkNodeType.SPLITTER,
  onu: NetworkNodeType.ONU,
  pop: NetworkNodeType.POP,
  fiber_route: NetworkNodeType.ACCESS_NODE,
};

export function getAssetKindIcon(kind: AssetKind): PhosphorIconsType {
  return NODE_TYPE_ICONS[kindToNodeType[kind]] ?? "Circle";
}

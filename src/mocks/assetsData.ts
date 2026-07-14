import type { Asset, AssetKind, AssetStatus } from "@/types/domain";
import { buildSheetNetworkSeed } from "@/mocks/sheetNetworkGenerator";

const seedAssets: Asset[] = buildSheetNetworkSeed().assets;

let assets: Asset[] = seedAssets.map((asset) => ({ ...asset }));

const kindPrefixes: Record<AssetKind, string> = {
  pole: "pole",
  junction_box: "jb",
  splitter: "split",
  onu: "onu",
  pop: "pop",
  fiber_route: "fiber-route",
};

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return slug || "asset";
}

function nextAssetId(kind: AssetKind, name: string): string {
  const prefix = kindPrefixes[kind];
  const slug = slugify(name);

  if (kind === "fiber_route") {
    const existing = assets.filter((asset) => asset.kind === "fiber_route").length;
    return `${prefix}-${String(existing + 1).padStart(3, "0")}`;
  }

  const matching = assets.filter((asset) => asset.id.startsWith(`${prefix}-${slug}-`));
  return `${prefix}-${slug}-${String(matching.length + 1).padStart(2, "0")}`;
}

export function getAssets(): Asset[] {
  return assets.map((asset) => ({ ...asset }));
}

export type CreateAssetInput = {
  name: string;
  kind: AssetKind;
  status: AssetStatus;
  location: { lat: number; lng: number };
};

export function createAsset(data: CreateAssetInput): Asset {
  const asset: Asset = {
    id: nextAssetId(data.kind, data.name),
    kind: data.kind,
    name: data.name,
    status: data.status,
    location: data.location,
  };

  assets = [asset, ...assets];
  return { ...asset };
}

export function updateAsset(
  id: string,
  patch: Partial<Pick<Asset, "name" | "status" | "monitorHost">> & {
    location?: { lat: number; lng: number };
  }
): Asset {
  const index = assets.findIndex((asset) => asset.id === id);
  if (index === -1) {
    throw new Error("Asset not found");
  }

  const updated: Asset = {
    ...assets[index]!,
    ...patch,
    location: patch.location ?? assets[index]!.location,
  };
  assets = [...assets.slice(0, index), updated, ...assets.slice(index + 1)];
  return { ...updated };
}

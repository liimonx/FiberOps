import type { Asset, AssetKind, AssetStatus } from "@/types/domain";
import { clientsSheetRows } from "@/mocks/clientsSheetData";

const DEMO_CENTER = { lat: 24.5339807, lng: 89.6174234 } as const;

function hashStringToUint32(input: string): number {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function slugifyPopName(input: string) {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return slug || "pop";
}

function randomLatLngWithinMeters(
  rng: () => number,
  center: { lat: number; lng: number },
  radiusMeters: number
) {
  const r = Math.sqrt(rng()) * radiusMeters;
  const theta = rng() * Math.PI * 2;
  const dx = r * Math.cos(theta);
  const dy = r * Math.sin(theta);

  const metersPerDegLat = 111_320;
  const metersPerDegLng = metersPerDegLat * Math.cos((center.lat * Math.PI) / 180);

  return {
    lat: center.lat + dy / metersPerDegLat,
    lng: center.lng + dx / Math.max(1e-9, metersPerDegLng),
  };
}

function uniquePopNamesFromSheet(): string[] {
  const set = new Set<string>();
  for (const row of clientsSheetRows) {
    const name = (row.pop ?? "").trim();
    if (name) set.add(name);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function generateSeedAssetsFromSheet(): Asset[] {
  const popNames = uniquePopNamesFromSheet();
  const radiusMeters = 2500;

  return popNames.map((popName, idx) => {
    const rng = mulberry32(hashStringToUint32(`clients.xlsx:pop:${popName}`));
    const location = randomLatLngWithinMeters(rng, DEMO_CENTER, radiusMeters);
    const id = `pop-${slugifyPopName(popName)}-${String(idx + 1).padStart(2, "0")}`;

    return {
      id,
      kind: "pop",
      name: popName,
      status: "active",
      location,
    };
  });
}

const seedAssets: Asset[] = generateSeedAssetsFromSheet();

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

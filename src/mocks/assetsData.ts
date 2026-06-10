import type { Asset, AssetKind, AssetStatus } from "@/types/domain";

const seedAssets: Asset[] = [
  {
    id: "pop-dhaka-01",
    kind: "pop",
    name: "Dhaka Main PoP",
    status: "active",
    location: { lat: 23.8103, lng: 90.4125 },
  },
  {
    id: "pop-gulshan-01",
    kind: "pop",
    name: "Gulshan PoP",
    status: "active",
    location: { lat: 23.7925, lng: 90.4078 },
  },
  {
    id: "jb-banani-01",
    kind: "junction_box",
    name: "Banani Junction Box A",
    status: "active",
    location: { lat: 23.7937, lng: 90.4066 },
  },
  {
    id: "jb-mohakhali-01",
    kind: "junction_box",
    name: "Mohakhali Junction",
    status: "degraded",
    location: { lat: 23.7789, lng: 90.3944 },
  },
  {
    id: "jb-tejgaon-01",
    kind: "junction_box",
    name: "Tejgaon Distribution Hub",
    status: "active",
    location: { lat: 23.7644, lng: 90.3928 },
  },
  {
    id: "split-gulshan-01",
    kind: "splitter",
    name: "Gulshan Splitter 1:8",
    status: "active",
    location: { lat: 23.7935, lng: 90.4085 },
  },
  {
    id: "split-banani-01",
    kind: "splitter",
    name: "Banani Splitter 1:16",
    status: "active",
    location: { lat: 23.7945, lng: 90.4072 },
  },
  {
    id: "pole-road-12-01",
    kind: "pole",
    name: "Road 12 Pole #1",
    status: "active",
    location: { lat: 23.795, lng: 90.409 },
  },
  {
    id: "pole-road-12-02",
    kind: "pole",
    name: "Road 12 Pole #2",
    status: "active",
    location: { lat: 23.7955, lng: 90.4095 },
  },
  {
    id: "pole-main-st-01",
    kind: "pole",
    name: "Main Street Pole A",
    status: "down",
    location: { lat: 23.796, lng: 90.41 },
  },
  {
    id: "fiber-route-001",
    kind: "fiber_route",
    name: "Gulshan-Banani Fiber Link",
    status: "active",
    location: { lat: 23.794, lng: 90.408 },
  },
  {
    id: "fiber-route-002",
    kind: "fiber_route",
    name: "Mohakhali Link Segment",
    status: "maintenance",
    location: { lat: 23.78, lng: 90.395 },
  },
  {
    id: "onu-cust-001",
    kind: "onu",
    name: "Customer ONU - Rahman Residence",
    status: "active",
    location: { lat: 23.7965, lng: 90.4105 },
  },
  {
    id: "onu-cust-002",
    kind: "onu",
    name: "Customer ONU - Karim Tower",
    status: "active",
    location: { lat: 23.797, lng: 90.411 },
  },
  {
    id: "onu-cust-003",
    kind: "onu",
    name: "Customer ONU - Ahmed Plaza",
    status: "down",
    location: { lat: 23.7975, lng: 90.4115 },
  },
];

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

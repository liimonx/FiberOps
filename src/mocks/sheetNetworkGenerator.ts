import type { Asset, AssetStatus } from "@/types/domain";
import { clientsSheetRows, type ClientSheetRow } from "@/mocks/clientsSheetData";

export const DEMO_CENTER = { lat: 24.5339807, lng: 89.6174234 } as const;

export type LatLng = { lat: number; lng: number };

export function hashStringToUint32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function slugifyPopName(input: string) {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return slug || "pop";
}

export function randomLatLngWithinMeters(
  rng: () => number,
  center: LatLng,
  radiusMeters: number
): LatLng {
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

function offsetMeters(center: LatLng, eastMeters: number, northMeters: number): LatLng {
  const metersPerDegLat = 111_320;
  const metersPerDegLng = metersPerDegLat * Math.cos((center.lat * Math.PI) / 180);
  return {
    lat: center.lat + northMeters / metersPerDegLat,
    lng: center.lng + eastMeters / Math.max(1e-9, metersPerDegLng),
  };
}

function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

export function getPopLocation(popName: string): LatLng {
  const rng = mulberry32(hashStringToUint32(`clients.xlsx:pop:${popName}`));
  return randomLatLngWithinMeters(rng, DEMO_CENTER, 2500);
}

function assetStatusFromSheet(status: string | null | undefined): AssetStatus {
  const s = (status ?? "").toLowerCase();
  if (s === "locked") return "down";
  return "active";
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export type GeneratedCustomerPlacement = {
  row: ClientSheetRow;
  customerId: string;
  location: LatLng;
  relatedOnuId: string;
};

export type SheetNetworkSeed = {
  assets: Asset[];
  customerPlacements: GeneratedCustomerPlacement[];
};

export function buildSheetNetworkSeed(): SheetNetworkSeed {
  if (cachedSeed) return cachedSeed;

  const assets: Asset[] = [];
  const customerPlacements: GeneratedCustomerPlacement[] = [];

  const rowsByPop = new Map<string, ClientSheetRow[]>();
  for (const row of clientsSheetRows) {
    const popName = (row.pop ?? "Unknown").trim() || "Unknown";
    const list = rowsByPop.get(popName) ?? [];
    list.push(row);
    rowsByPop.set(popName, list);
  }

  const popNames = Array.from(rowsByPop.keys()).sort((a, b) => a.localeCompare(b));

  for (const [popIndex, popName] of popNames.entries()) {
    const popSlug = slugifyPopName(popName);
    const popId = `pop-${popSlug}-${String(popIndex + 1).padStart(2, "0")}`;
    const popLocation = getPopLocation(popName);
    const popRows = rowsByPop.get(popName) ?? [];

    assets.push({
      id: popId,
      kind: "pop",
      name: popName,
      status: "active",
      location: popLocation,
    });

    const jbId = `jb-${popSlug}-01`;
    const jbLocation = offsetMeters(popLocation, 120, 80);
    assets.push({
      id: jbId,
      kind: "junction_box",
      name: `${popName} Junction`,
      status: "active",
      location: jbLocation,
    });

    const splitterChunks = chunk(popRows, 8);

    splitterChunks.forEach((splitRows, splitIndex) => {
      const splitSeq = String(splitIndex + 1).padStart(2, "0");
      const splitId = `split-${popSlug}-${splitSeq}`;
      const splitRng = mulberry32(hashStringToUint32(`${popName}:split:${splitIndex}`));
      const splitLocation = randomLatLngWithinMeters(splitRng, jbLocation, 350);

      assets.push({
        id: splitId,
        kind: "splitter",
        name: `${popName} Splitter ${splitIndex + 1}`,
        status: "active",
        location: splitLocation,
      });

      splitRows.forEach((row) => {
        const customerId = `cust-${row.customerId}`;
        const onuId = `onu-${row.customerId}`;
        const poleId = `pole-${row.customerId}`;
        const rowRng = mulberry32(hashStringToUint32(`clients.xlsx:${row.customerId}`));
        const customerLocation = randomLatLngWithinMeters(rowRng, popLocation, 1800);
        const assetStatus = assetStatusFromSheet(row.status);

        const poleLocation = interpolate(splitLocation, customerLocation, 0.65);
        const onuLocation = interpolate(splitLocation, customerLocation, 0.92);

        assets.push({
          id: poleId,
          kind: "pole",
          name: `Pole ${row.customerId}`,
          status: assetStatus === "down" ? "degraded" : "active",
          location: poleLocation,
        });

        assets.push({
          id: onuId,
          kind: "onu",
          name: `ONU ${row.pppoe ?? row.customerId}`,
          status: assetStatus,
          location: onuLocation,
        });

        customerPlacements.push({
          row,
          customerId,
          location: customerLocation,
          relatedOnuId: onuId,
        });
      });
    });
  }

  cachedSeed = { assets, customerPlacements };
  return cachedSeed;
}

let cachedSeed: SheetNetworkSeed | null = null;

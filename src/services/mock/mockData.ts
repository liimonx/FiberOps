import type {
  Asset,
  AssetKind,
  AssetStatus,
  Customer,
  CustomerStatus,
  Incident,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/domain";

/** Reproducible pseudo-random for stable mock data across reloads. */
function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0x4669626572); // "Fiber" in hex-ish flavor

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function jitterLatLng(
  base: { lat: number; lng: number },
  radiusDeg: number
): { lat: number; lng: number } {
  const u = rng() * 2 - 1;
  const v = rng() * 2 - 1;
  return {
    lat: base.lat + u * radiusDeg,
    lng: base.lng + v * radiusDeg,
  };
}

/** Major Dhaka metro clusters (fiber ISPs typically anchor PoPs / aggregation here). */
const REGIONS = [
  { slug: "gul", label: "Gulshan", center: { lat: 23.7925, lng: 90.4078 } },
  { slug: "ban", label: "Banani", center: { lat: 23.794, lng: 90.403 } },
  { slug: "utt", label: "Uttara", center: { lat: 23.8759, lng: 90.3795 } },
  { slug: "mir", label: "Mirpur", center: { lat: 23.8223, lng: 90.3654 } },
  { slug: "dha", label: "Dhanmondi", center: { lat: 23.7461, lng: 90.3742 } },
  { slug: "moh", label: "Mohakhali", center: { lat: 23.7806, lng: 90.4059 } },
  { slug: "bar", label: "Baridhara", center: { lat: 23.8061, lng: 90.4215 } },
  { slug: "bas", label: "Bashundhara", center: { lat: 23.8179, lng: 90.4536 } },
  { slug: "mot", label: "Motijheel", center: { lat: 23.733, lng: 90.4172 } },
  { slug: "wari", label: "Wari", center: { lat: 23.7238, lng: 90.4118 } },
  { slug: "ram", label: "Rampura", center: { lat: 23.7613, lng: 90.4159 } },
  { slug: "khil", label: "Khilgaon", center: { lat: 23.7497, lng: 90.442 } },
] as const;

const PLANS = [
  "Fiber 50Mbps",
  "Fiber 100Mbps",
  "Fiber 200Mbps",
  "Fiber 500Mbps",
  "Fiber 1Gbps",
  "Fiber 2Gbps",
] as const;

const CUSTOMER_FIRST = [
  "Rahman",
  "Karim",
  "Ahmed",
  "Hossain",
  "Islam",
  "Chowdhury",
  "Begum",
  "Siddiqui",
  "Kabir",
  "Mahmud",
  "Hasan",
  "Ali",
  "Yasmin",
  "Farhana",
  "Nadia",
  "Rubel",
  "Tanvir",
  "Shuvo",
  "Arif",
  "Mehedi",
] as const;

const CUSTOMER_SUFFIX = [
  "Residence",
  "Tower",
  "Plaza",
  "Enterprise",
  "Heights",
  "Complex",
  "Studio",
  "Villa",
  "Hospital",
  "School",
  "Cafe",
  "Mart",
  "Logistics",
  "Pharma",
  "Garments",
  "IT Park",
  "Co-working",
  "Bank Branch",
  "Clinic",
  "Showroom",
] as const;

const STATUS_WEIGHTS: { status: AssetStatus; weight: number }[] = [
  { status: "active", weight: 0.82 },
  { status: "degraded", weight: 0.08 },
  { status: "maintenance", weight: 0.06 },
  { status: "down", weight: 0.04 },
];

function weightedAssetStatus(): AssetStatus {
  const r = rng();
  let acc = 0;
  for (const { status, weight } of STATUS_WEIGHTS) {
    acc += weight;
    if (r <= acc) return status;
  }
  return "active";
}

const CUSTOMER_STATUS_WEIGHTS: { status: CustomerStatus; weight: number }[] = [
  { status: "online", weight: 0.88 },
  { status: "offline", weight: 0.06 },
  { status: "unstable", weight: 0.06 },
];

function weightedCustomerStatus(): CustomerStatus {
  const r = rng();
  let acc = 0;
  for (const { status, weight } of CUSTOMER_STATUS_WEIGHTS) {
    acc += weight;
    if (r <= acc) return status;
  }
  return "online";
}

function assetName(kind: AssetKind, regionLabel: string, seq: number): string {
  switch (kind) {
    case "pop":
      return `${regionLabel} PoP-${String(seq).padStart(2, "0")}`;
    case "junction_box":
      return `${regionLabel} JB-${seq}`;
    case "splitter":
      return `${regionLabel} Splitter-${seq}`;
    case "pole":
      return `${regionLabel.slice(0, 3)} Pole ${seq}`;
    case "onu":
      return `ONU-${regionLabel.slice(0, 3).toUpperCase()}-${1000 + seq}`;
    case "fiber_route":
      return `${regionLabel} Backbone Seg ${seq}`;
    default:
      return `${regionLabel} Asset ${seq}`;
  }
}

function generateAssets(): Asset[] {
  const assets: Asset[] = [];

  const push = (
    kind: AssetKind,
    slug: string,
    regionLabel: string,
    center: { lat: number; lng: number },
    radius: number,
    localSeq: number
  ) => {
    const id = `${kind.replace("_", "-")}-${slug}-${String(localSeq).padStart(3, "0")}`;
    assets.push({
      id,
      kind,
      name: assetName(kind, regionLabel, localSeq),
      status: weightedAssetStatus(),
      location: jitterLatLng(center, radius),
    });
  };

  // PoPs: one primary + occasional secondary per region
  for (const r of REGIONS) {
    push("pop", r.slug, r.label, r.center, 0.004, 1);
    if (rng() > 0.55) {
      push("pop", r.slug, r.label, r.center, 0.006, 2);
    }
  }

  // Distribution layer: many sites per region
  for (const r of REGIONS) {
    const jbCount = 8 + Math.floor(rng() * 7);
    for (let i = 1; i <= jbCount; i++) {
      push("junction_box", r.slug, r.label, r.center, 0.012, i);
    }
    const splitCount = 10 + Math.floor(rng() * 9);
    for (let i = 1; i <= splitCount; i++) {
      push("splitter", r.slug, r.label, r.center, 0.014, i);
    }
    const poleCount = 28 + Math.floor(rng() * 18);
    for (let i = 1; i <= poleCount; i++) {
      push("pole", r.slug, r.label, r.center, 0.018, i);
    }
    const onuCount = 36 + Math.floor(rng() * 24);
    for (let i = 1; i <= onuCount; i++) {
      push("onu", r.slug, r.label, r.center, 0.02, i);
    }
    const fiberCount = 5 + Math.floor(rng() * 6);
    for (let i = 1; i <= fiberCount; i++) {
      push("fiber_route", r.slug, r.label, r.center, 0.022, i);
    }
  }

  return assets;
}

function generateCustomers(count: number): Customer[] {
  const customers: Customer[] = [];
  for (let i = 0; i < count; i++) {
    const region = pick(REGIONS);
    const name = `${pick(CUSTOMER_FIRST)} ${pick(CUSTOMER_SUFFIX)}`;
    customers.push({
      id: `cust-${String(i + 1).padStart(5, "0")}`,
      name,
      plan: pick(PLANS),
      status: weightedCustomerStatus(),
      location: jitterLatLng(region.center, 0.025),
    });
  }
  return customers;
}

const INCIDENT_STATUS: IncidentStatus[] = [
  "new",
  "investigating",
  "assigned",
  "resolved",
];

function severityFromRoll(): IncidentSeverity {
  const r = rng();
  if (r < 0.06) return "critical";
  if (r < 0.22) return "high";
  if (r < 0.55) return "medium";
  return "low";
}

function titleForIncident(
  severity: IncidentSeverity,
  asset: Asset
): string {
  const place = asset.name.split(" ").slice(0, 2).join(" ");
  switch (asset.kind) {
    case "fiber_route":
      return severity === "critical"
        ? `Critical: Fiber cut — ${place}`
        : `Signal loss on backbone — ${place}`;
    case "pole":
      return severity === "critical"
        ? `Outage: Pole infrastructure — ${place}`
        : `Pole inspection / tilt reported — ${place}`;
    case "onu":
      return `Customer circuit offline — ${place}`;
    case "junction_box":
      return `Water ingress suspected — ${place}`;
    case "splitter":
      return `High optical loss at splitter — ${place}`;
    case "pop":
      return severity === "critical"
        ? `PoP partial outage — ${place}`
        : `Elevated errors at ${place}`;
    default:
      return `Network event — ${asset.name}`;
  }
}

function generateIncidents(assets: Asset[], count: number): Incident[] {
  const pool = assets.filter((a) =>
    ["pole", "onu", "junction_box", "splitter", "fiber_route", "pop"].includes(
      a.kind
    )
  );
  const incidents: Incident[] = [];
  for (let i = 0; i < count; i++) {
    const asset = pick(pool);
    const severity = severityFromRoll();
    incidents.push({
      id: `inc-${String(i + 1).padStart(4, "0")}`,
      title: titleForIncident(severity, asset),
      severity,
      status: pick(INCIDENT_STATUS),
      relatedAssetId: asset.id,
    });
  }
  return incidents;
}

const _assets = generateAssets();

export const mockAssets: Asset[] = _assets;

export const mockCustomers: Customer[] = generateCustomers(2400);

export const mockIncidents: Incident[] = generateIncidents(_assets, 180);

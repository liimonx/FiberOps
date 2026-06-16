import type {
  BillingStatus,
  Customer,
  CustomerStatus,
} from "@/types/domain";
import { clientsSheetRows } from "@/mocks/clientsSheetData";

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

type SeedCustomer = Omit<Customer, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
};

const DEMO_CENTER = { lat: 24.5339807, lng: 89.6174234 } as const;
const POP_A_CENTER = { lat: DEMO_CENTER.lat + 0.004, lng: DEMO_CENTER.lng - 0.006 } as const;
const POP_B_CENTER = { lat: DEMO_CENTER.lat - 0.004, lng: DEMO_CENTER.lng + 0.006 } as const;

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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function randomLatLngWithinMeters(
  rng: () => number,
  center: { lat: number; lng: number },
  radiusMeters: number
) {
  // Uniformly distributed within a circle (sqrt for radius)
  const r = Math.sqrt(rng()) * radiusMeters;
  const theta = rng() * Math.PI * 2;
  const dx = r * Math.cos(theta);
  const dy = r * Math.sin(theta);

  // Convert meters → degrees
  const metersPerDegLat = 111_320;
  const metersPerDegLng = metersPerDegLat * Math.cos((center.lat * Math.PI) / 180);

  const lat = center.lat + dy / metersPerDegLat;
  const lng = center.lng + dx / Math.max(1e-9, metersPerDegLng);
  return { lat, lng };
}

function normalizeSheetStatus(status: string | null | undefined): CustomerStatus {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "online";
  if (s === "locked") return "offline";
  return "unstable";
}

function normalizeSheetBilling(status: string | null | undefined): BillingStatus {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "paid";
  if (s === "locked") return "overdue";
  return "unpaid";
}

function stableRngForCustomer(customerId: string): () => number {
  return mulberry32(hashStringToUint32(`clients.xlsx:${customerId}`));
}

function popCenterForName(popName: string | null | undefined) {
  // If POP names map to real POP assets, customers cluster around those assets.
  // Fallback to 2-way split so we still render if POP is missing.
  const key = (popName ?? "").trim();
  if (!key) return POP_A_CENTER;
  const h = hashStringToUint32(`clients.xlsx:pop:${key.toLowerCase()}`);
  return h % 2 === 0 ? POP_A_CENTER : POP_B_CENTER;
}

function createNotes(row: (typeof clientsSheetRows)[number]): string {
  const parts: string[] = [];
  if (row.pppoe) parts.push(`PPPoE: ${row.pppoe}`);
  if (row.package) parts.push(`Package: ${row.package}`);
  if (row.bill != null) parts.push(`Bill: ${row.bill}`);
  if (row.pop) parts.push(`POP: ${row.pop}`);
  if (row.billingNumber) parts.push(`Billing Number: ${row.billingNumber}`);
  if (row.validity) parts.push(`Validity: ${row.validity}`);
  if (row.status) parts.push(`Status: ${row.status}`);
  return parts.join(" | ");
}

function generateCustomersFromSheet(): SeedCustomer[] {
  const radiusMeters = 1800;

  return clientsSheetRows.map((row) => {
    const rng = stableRngForCustomer(row.customerId);
    const center = popCenterForName(row.pop);
    const location = randomLatLngWithinMeters(rng, center, radiusMeters);
    const createdDays = Math.floor(clamp(rng() * 420, 5, 420));
    const updatedDays = Math.floor(clamp(rng() * 30, 0, 30));

    return {
      id: `cust-${row.customerId}`,
      name: row.name ?? `Client ${row.customerId}`,
      plan: row.package ?? "Package-1",
      status: normalizeSheetStatus(row.status),
      billingStatus: normalizeSheetBilling(row.status),
      email: undefined,
      location,
      notes: createNotes(row),
      createdAt: daysAgo(createdDays),
      updatedAt: daysAgo(updatedDays),
    };
  });
}

const seedCustomers: SeedCustomer[] = generateCustomersFromSheet();

function normalizeCustomer(seed: SeedCustomer): Customer {
  const now = new Date().toISOString();
  return {
    ...seed,
    createdAt: seed.createdAt ?? now,
    updatedAt: seed.updatedAt ?? now,
  };
}

let customers: Customer[] = seedCustomers.map(normalizeCustomer);

function nextCustomerId(): string {
  const max = customers.reduce((acc, customer) => {
    const num = Number.parseInt(customer.id.replace("cust-", ""), 10);
    return Number.isNaN(num) ? acc : Math.max(acc, num);
  }, 0);
  return `cust-${String(max + 1).padStart(3, "0")}`;
}

export function getCustomers(): Customer[] {
  return customers.map((customer) => ({ ...customer }));
}

export function getCustomerById(id: string): Customer | undefined {
  const customer = customers.find((item) => item.id === id);
  return customer ? { ...customer } : undefined;
}

export type CreateCustomerInput = {
  name: string;
  plan: string;
  status: CustomerStatus;
  email?: string;
  relatedOnuId?: string;
  location?: { lat: number; lng: number };
};

export function createCustomer(data: CreateCustomerInput): Customer {
  const now = new Date().toISOString();
  const customer: Customer = {
    id: nextCustomerId(),
    name: data.name,
    plan: data.plan,
    status: data.status,
    billingStatus: "paid",
    relatedOnuId: data.relatedOnuId,
    email: data.email,
    location: data.location,
    createdAt: now,
    updatedAt: now,
  };
  customers = [customer, ...customers];
  return { ...customer };
}

export type UpdateCustomerInput = {
  name?: string;
  plan?: string;
  status?: CustomerStatus;
  billingStatus?: BillingStatus;
  email?: string;
  relatedOnuId?: string;
  notes?: string;
  location?: { lat: number; lng: number };
};

export function updateCustomer(
  id: string,
  patch: UpdateCustomerInput
): Customer {
  const index = customers.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error("Customer not found");
  }

  const existing = customers[index];
  const now = new Date().toISOString();
  const updated: Customer = {
    ...existing,
    ...patch,
    updatedAt: now,
  };

  customers = [
    ...customers.slice(0, index),
    updated,
    ...customers.slice(index + 1),
  ];
  return { ...updated };
}

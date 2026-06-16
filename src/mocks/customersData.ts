import type {
  BillingStatus,
  Customer,
  CustomerStatus,
} from "@/types/domain";

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

function randomChoice<T>(rng: () => number, options: readonly T[]): T {
  return options[Math.floor(rng() * options.length)]!;
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

function generateDemoCustomers(): SeedCustomer[] {
  const seed = hashStringToUint32("fiberops-demo-brothers-2026-06");
  const rng = mulberry32(seed);

  const plans = [
    "Fiber 50Mbps",
    "Fiber 100Mbps",
    "Fiber 200Mbps",
    "Fiber 500Mbps",
    "Fiber 1Gbps",
  ] as const;

  const makeStatus = (): CustomerStatus => {
    const x = rng();
    if (x < 0.08) return "offline";
    if (x < 0.20) return "unstable";
    return "online";
  };

  const makeBilling = (status: CustomerStatus): BillingStatus => {
    const x = rng();
    if (status === "offline" && x < 0.6) return "overdue";
    if (x < 0.08) return "overdue";
    if (x < 0.16) return "unpaid";
    return "paid";
  };

  const customersOut: SeedCustomer[] = [];
  const total = 300;
  const perPop = total / 2;
  const radiusMeters = 1800;

  for (let i = 1; i <= total; i++) {
    const id = `cust-${String(i).padStart(3, "0")}`;
    const popCenter = i <= perPop ? POP_A_CENTER : POP_B_CENTER;
    const location = randomLatLngWithinMeters(rng, popCenter, radiusMeters);

    const status = makeStatus();
    const billingStatus = makeBilling(status);
    const plan = randomChoice(rng, plans);

    const createdDays = Math.floor(clamp(rng() * 420, 5, 420));
    const updatedDays = Math.floor(clamp(rng() * 30, 0, 30));

    customersOut.push({
      id,
      name: `Demo User ${String(i).padStart(3, "0")}`,
      plan,
      status,
      billingStatus,
      location,
      createdAt: daysAgo(createdDays),
      updatedAt: daysAgo(updatedDays),
    });
  }

  return customersOut;
}

const seedCustomers: SeedCustomer[] = generateDemoCustomers();

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

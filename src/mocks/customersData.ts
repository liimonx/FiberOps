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

const seedCustomers: SeedCustomer[] = [
  {
    id: "cust-001",
    name: "Rahman Residence",
    plan: "Fiber 100Mbps",
    status: "online",
    billingStatus: "paid",
    relatedOnuId: "onu-cust-001",
    email: "rahman@example.com",
    location: { lat: 23.7948, lng: 90.4088 },
    createdAt: daysAgo(180),
    updatedAt: daysAgo(2),
  },
  {
    id: "cust-002",
    name: "Karim Tower",
    plan: "Fiber 200Mbps",
    status: "online",
    billingStatus: "paid",
    relatedOnuId: "onu-cust-002",
    email: "admin@karimtower.com",
    location: { lat: 23.7952, lng: 90.4092 },
    createdAt: daysAgo(120),
    updatedAt: daysAgo(5),
  },
  {
    id: "cust-003",
    name: "Ahmed Plaza",
    plan: "Fiber 50Mbps",
    status: "offline",
    billingStatus: "overdue",
    relatedOnuId: "onu-cust-003",
    email: "contact@ahmedplaza.bd",
    location: { lat: 23.7958, lng: 90.4098 },
    createdAt: daysAgo(90),
    updatedAt: daysAgo(1),
  },
  {
    id: "cust-004",
    name: "Hossain Enterprise",
    plan: "Fiber 500Mbps",
    status: "online",
    billingStatus: "paid",
    email: "billing@hossainent.com",
    location: { lat: 23.7932, lng: 90.4075 },
    createdAt: daysAgo(200),
    updatedAt: daysAgo(10),
  },
  {
    id: "cust-005",
    name: "Fatema Medical Center",
    plan: "Fiber 1Gbps",
    status: "unstable",
    billingStatus: "paid",
    email: "it@fatemamedical.com",
    location: { lat: 23.7940, lng: 90.4082 },
    createdAt: daysAgo(150),
    updatedAt: daysAgo(3),
  },
  {
    id: "cust-006",
    name: "Islam Apartment",
    plan: "Fiber 50Mbps",
    status: "online",
    billingStatus: "paid",
    email: "manager@islamapt.com",
    location: { lat: 23.7943, lng: 90.4070 },
    createdAt: daysAgo(60),
    updatedAt: daysAgo(7),
  },
  {
    id: "cust-007",
    name: "Chowdhury Villa",
    plan: "Fiber 100Mbps",
    status: "online",
    billingStatus: "paid",
    email: "chowdhury@example.com",
    location: { lat: 23.7955, lng: 90.4085 },
    createdAt: daysAgo(45),
    updatedAt: daysAgo(14),
  },
  {
    id: "cust-008",
    name: "Begum House",
    plan: "Fiber 200Mbps",
    status: "online",
    billingStatus: "unpaid",
    email: "begum@example.com",
    location: { lat: 23.7938, lng: 90.4095 },
    createdAt: daysAgo(30),
    updatedAt: daysAgo(4),
  },
  {
    id: "cust-009",
    name: "Gulshan Tech Park",
    plan: "Fiber 1Gbps",
    status: "online",
    billingStatus: "paid",
    email: "ops@gulshantech.bd",
    location: { lat: 23.7928, lng: 90.4080 },
    createdAt: daysAgo(365),
    updatedAt: daysAgo(1),
  },
  {
    id: "cust-010",
    name: "Banani Shopping Complex",
    plan: "Fiber 500Mbps",
    status: "online",
    billingStatus: "paid",
    email: "admin@bananishop.bd",
    location: { lat: 23.7945, lng: 90.4075 },
    createdAt: daysAgo(220),
    updatedAt: daysAgo(6),
  },
  {
    id: "cust-011",
    name: "Dhaka Cafe & Restaurant",
    plan: "Fiber 100Mbps",
    status: "unstable",
    billingStatus: "overdue",
    email: "owner@dhakacafe.bd",
    location: { lat: 23.7950, lng: 90.4078 },
    createdAt: daysAgo(75),
    updatedAt: daysAgo(2),
  },
  {
    id: "cust-012",
    name: "Gulshan International School",
    plan: "Fiber 500Mbps",
    status: "online",
    billingStatus: "paid",
    email: "it@gulshanschool.edu.bd",
    location: { lat: 23.7935, lng: 90.4090 },
    createdAt: daysAgo(400),
    updatedAt: daysAgo(20),
  },
  {
    id: "cust-013",
    name: "Banani Library",
    plan: "Fiber 200Mbps",
    status: "online",
    billingStatus: "paid",
    email: "info@bananilibrary.bd",
    location: { lat: 23.7942, lng: 90.4068 },
    createdAt: daysAgo(100),
    updatedAt: daysAgo(8),
  },
];

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

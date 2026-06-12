import type { WorkOrder } from "@/types/domain";
import type {
  CreateWorkOrderFormValues,
  UpdateWorkOrderFormValues,
} from "@/modules/work-orders/schemas/workOrder.schema";

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const seedWorkOrders: WorkOrder[] = [
  {
    id: "WO-995",
    title: "Site Survey - Oak St",
    priority: "low",
    workType: "survey",
    status: "new",
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(48),
  },
  {
    id: "WO-994",
    title: "Signal Auditing",
    priority: "medium",
    workType: "audit",
    status: "assigned",
    assigneeId: "usr-002",
    relatedAssetId: "jb-mohakhali-01",
    createdAt: hoursAgo(36),
    updatedAt: hoursAgo(12),
  },
  {
    id: "WO-993",
    title: "Drop Cable Replacement",
    priority: "high",
    workType: "repair",
    status: "assigned",
    assigneeId: "usr-003",
    relatedIncidentId: "inc-002",
    relatedAssetId: "jb-mohakhali-01",
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(8),
  },
  {
    id: "WO-992",
    title: "New ONT Install",
    priority: "medium",
    workType: "install",
    status: "new",
    relatedAssetId: "onu-cust-003",
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
  },
  {
    id: "WO-991",
    title: "Splice Repair",
    priority: "critical",
    workType: "repair",
    status: "in_progress",
    assigneeId: "usr-002",
    relatedIncidentId: "inc-001",
    relatedAssetId: "pole-main-st-01",
    notes: "Emergency splice kit deployed. Awaiting fiber continuity test.",
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(2),
  },
  {
    id: "WO-990",
    title: "PoP Rack Inspection",
    priority: "low",
    workType: "audit",
    status: "in_progress",
    assigneeId: "usr-004",
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(6),
  },
  {
    id: "WO-989",
    title: "Node Beta Upgrades",
    priority: "high",
    workType: "upgrade",
    status: "review",
    assigneeId: "usr-003",
    relatedAssetId: "splitter-beta-01",
    notes: "Firmware upgrade complete. Pending QA sign-off.",
    createdAt: hoursAgo(96),
    updatedAt: hoursAgo(4),
  },
  {
    id: "WO-988",
    title: "Junction Box Seal Replacement",
    priority: "medium",
    workType: "repair",
    status: "review",
    assigneeId: "usr-002",
    createdAt: hoursAgo(60),
    updatedAt: hoursAgo(10),
  },
  {
    id: "WO-987",
    title: "Fiber Route Marking",
    priority: "low",
    workType: "survey",
    status: "done",
    assigneeId: "usr-004",
    createdAt: hoursAgo(120),
    updatedAt: hoursAgo(24),
  },
  {
    id: "WO-980",
    title: "Drop Cable Install",
    priority: "medium",
    workType: "install",
    status: "done",
    assigneeId: "usr-003",
    createdAt: hoursAgo(200),
    updatedAt: hoursAgo(48),
  },
  {
    id: "WO-979",
    title: "Customer Router Setup",
    priority: "low",
    workType: "setup",
    status: "done",
    assigneeId: "usr-002",
    createdAt: hoursAgo(180),
    updatedAt: hoursAgo(72),
  },
  {
    id: "WO-978",
    title: "Splitter Capacity Check",
    priority: "medium",
    workType: "audit",
    status: "new",
    relatedAssetId: "splitter-beta-01",
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
];

let workOrders: WorkOrder[] = seedWorkOrders.map((order) => ({ ...order }));

let nextId = 996;

function generateWorkOrderId(): string {
  const id = `WO-${nextId}`;
  nextId += 1;
  return id;
}

export function getWorkOrders(): WorkOrder[] {
  return workOrders.map((order) => ({ ...order }));
}

export function getWorkOrderById(id: string): WorkOrder | undefined {
  const order = workOrders.find((item) => item.id === id);
  return order ? { ...order } : undefined;
}

export function createWorkOrder(data: CreateWorkOrderFormValues): WorkOrder {
  const now = new Date().toISOString();
  const order: WorkOrder = {
    id: generateWorkOrderId(),
    title: data.title,
    priority: data.priority,
    workType: data.workType,
    status: "new",
    assigneeId: data.assigneeId || undefined,
    relatedIncidentId: data.relatedIncidentId || undefined,
    relatedAssetId: data.relatedAssetId || undefined,
    notes: data.notes || undefined,
    createdAt: now,
    updatedAt: now,
  };

  workOrders = [order, ...workOrders];
  return { ...order };
}

export function updateWorkOrder(
  id: string,
  data: UpdateWorkOrderFormValues
): WorkOrder {
  const index = workOrders.findIndex((order) => order.id === id);

  if (index === -1) {
    throw new Error("Work order not found");
  }

  const current = workOrders[index];
  const updated: WorkOrder = {
    ...current,
    ...data,
    assigneeId:
      data.assigneeId === null
        ? undefined
        : data.assigneeId !== undefined
          ? data.assigneeId || undefined
          : current.assigneeId,
    relatedIncidentId:
      data.relatedIncidentId === null
        ? undefined
        : data.relatedIncidentId !== undefined
          ? data.relatedIncidentId || undefined
          : current.relatedIncidentId,
    relatedAssetId:
      data.relatedAssetId === null
        ? undefined
        : data.relatedAssetId !== undefined
          ? data.relatedAssetId || undefined
          : current.relatedAssetId,
    updatedAt: new Date().toISOString(),
  };

  workOrders[index] = updated;
  return { ...updated };
}

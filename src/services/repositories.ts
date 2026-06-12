import type {
  Asset,
  Customer,
  Incident,
  OrganizationSettings,
  PlanningProposal,
} from "@/types/domain";

export type ListResult<T> = { items: T[] };

export type CreateAssetInput = {
  name: string;
  kind: Asset["kind"];
  status: Asset["status"];
  location: Asset["location"];
};

export interface AssetRepository {
  list(): Promise<ListResult<Asset>>;
  create(data: CreateAssetInput): Promise<Asset>;
}

export interface CustomerRepository {
  list(): Promise<ListResult<Customer>>;
}

export type CreateIncidentInput = {
  title: string;
  severity: Incident["severity"];
  relatedAssetId?: string;
  notes?: string;
};

export type UpdateIncidentInput = {
  status?: Incident["status"];
  notes?: string;
  technician?: string;
  resolutionNotes?: string;
};

export interface IncidentRepository {
  list(): Promise<ListResult<Incident>>;
  getById(id: string): Promise<Incident | null>;
  create(data: CreateIncidentInput): Promise<Incident>;
  update(id: string, data: UpdateIncidentInput): Promise<Incident>;
}

export interface SettingsRepository {
  getOrganization(): Promise<OrganizationSettings>;
  updateOrganization(data: OrganizationSettings): Promise<OrganizationSettings>;
}

export type CreatePlanningProposalInput = {
  title: string;
  description?: string;
  type: PlanningProposal["type"];
  targetArea: string;
  relatedAssetId?: string;
  estimatedNewCustomers: number;
  currentUtilizationPercent?: number;
  projectedUtilizationPercent: number;
  estimatedBudgetUsd: number;
  budgetLineItems?: PlanningProposal["budgetLineItems"];
  owner: string;
  targetStartDate?: string;
  targetCompletionDate?: string;
  notes?: string;
};

export type UpdatePlanningProposalInput = Partial<
  Omit<PlanningProposal, "id" | "createdAt" | "updatedAt">
>;

export interface PlanningProposalRepository {
  list(): Promise<ListResult<PlanningProposal>>;
  getById(id: string): Promise<PlanningProposal | null>;
  create(data: CreatePlanningProposalInput): Promise<PlanningProposal>;
  update(id: string, data: UpdatePlanningProposalInput): Promise<PlanningProposal>;
}


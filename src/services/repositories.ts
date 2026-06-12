import type {
  Asset,
  Customer,
  GeneratedReport,
  Incident,
  IncidentAnalytics,
  OrganizationSettings,
  PlanningProposal,
  ReportDownloadPayload,
  ReportsSummary,
  UptimeSummary,
  WorkOrder,
} from "@/types/domain";
import type { GenerateReportFormValues } from "@/modules/reports/schemas/report.schema";

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

export type CreateWorkOrderInput = {
  title: string;
  priority: WorkOrder["priority"];
  workType: WorkOrder["workType"];
  assigneeId?: string;
  relatedIncidentId?: string;
  relatedAssetId?: string;
  notes?: string;
};

export type UpdateWorkOrderInput = Partial<
  Omit<WorkOrder, "id" | "createdAt" | "updatedAt">
>;

export interface WorkOrderRepository {
  list(): Promise<ListResult<WorkOrder>>;
  getById(id: string): Promise<WorkOrder | null>;
  create(data: CreateWorkOrderInput): Promise<WorkOrder>;
  update(id: string, data: UpdateWorkOrderInput): Promise<WorkOrder>;
}

export interface ReportsRepository {
  getSummary(): Promise<ReportsSummary>;
  getIncidentAnalytics(period: string): Promise<IncidentAnalytics>;
  getUptimeSummary(period: string): Promise<UptimeSummary>;
  listHistory(): Promise<ListResult<GeneratedReport>>;
  generate(
    data: GenerateReportFormValues
  ): Promise<{ report: GeneratedReport; download: ReportDownloadPayload }>;
  getDownload(id: string): Promise<ReportDownloadPayload>;
}


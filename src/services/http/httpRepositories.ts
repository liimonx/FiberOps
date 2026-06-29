import type {
  AssetRepository,
  CreateAssetInput,
  CreateIncidentInput,
  CreatePlanningProposalInput,
  CreateWorkOrderInput,
  CustomerRepository,
  IncidentRepository,
  ListResult,
  PlanningProposalRepository,
  ReportsRepository,
  SettingsRepository,
  UpdateIncidentInput,
  UpdatePlanningProposalInput,
  UpdateWorkOrderInput,
  WorkOrderRepository,
} from "@/services/repositories";
import type {
  Asset,
  Customer,
  GeneratedReport,
  Incident,
  OrganizationSettings,
  PlanningProposal,
  ReportDownloadPayload,
  ReportsSummary,
  WorkOrder,
} from "@/types/domain";
import type { GenerateReportFormValues } from "@/modules/reports/schemas/report.schema";
import { fetchApi, fetchList } from "@/lib/fetchApi";

export const httpAssetRepository: AssetRepository = {
  async list(): Promise<ListResult<Asset>> {
    return { items: await fetchList<Asset>("/api/assets") };
  },
  async create(data: CreateAssetInput): Promise<Asset> {
    return fetchApi<Asset>("/api/assets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export const httpCustomerRepository: CustomerRepository = {
  async list(): Promise<ListResult<Customer>> {
    return { items: await fetchList<Customer>("/api/customers") };
  },
};

export const httpIncidentRepository: IncidentRepository = {
  async list(): Promise<ListResult<Incident>> {
    return { items: await fetchList<Incident>("/api/incidents") };
  },
  async getById(id: string): Promise<Incident | null> {
    try {
      return await fetchApi<Incident>(`/api/incidents/${id}`);
    } catch {
      return null;
    }
  },
  async create(data: CreateIncidentInput): Promise<Incident> {
    return fetchApi<Incident>("/api/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async update(id: string, data: UpdateIncidentInput): Promise<Incident> {
    return fetchApi<Incident>(`/api/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export const httpWorkOrderRepository: WorkOrderRepository = {
  async list(): Promise<ListResult<WorkOrder>> {
    return { items: await fetchList<WorkOrder>("/api/work-orders") };
  },
  async getById(id: string): Promise<WorkOrder | null> {
    try {
      return await fetchApi<WorkOrder>(`/api/work-orders/${id}`);
    } catch {
      return null;
    }
  },
  async create(data: CreateWorkOrderInput): Promise<WorkOrder> {
    return fetchApi<WorkOrder>("/api/work-orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async update(id: string, data: UpdateWorkOrderInput): Promise<WorkOrder> {
    return fetchApi<WorkOrder>(`/api/work-orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export const httpPlanningProposalRepository: PlanningProposalRepository = {
  async list(): Promise<ListResult<PlanningProposal>> {
    return { items: await fetchList<PlanningProposal>("/api/planning/proposals") };
  },
  async getById(id: string): Promise<PlanningProposal | null> {
    try {
      return await fetchApi<PlanningProposal>(`/api/planning/proposals/${id}`);
    } catch {
      return null;
    }
  },
  async create(data: CreatePlanningProposalInput): Promise<PlanningProposal> {
    return fetchApi<PlanningProposal>("/api/planning/proposals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async update(id: string, data: UpdatePlanningProposalInput): Promise<PlanningProposal> {
    return fetchApi<PlanningProposal>(`/api/planning/proposals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export const httpSettingsRepository: SettingsRepository = {
  async getOrganization(): Promise<OrganizationSettings> {
    return fetchApi<OrganizationSettings>("/api/settings/organization");
  },
  async updateOrganization(data: OrganizationSettings): Promise<OrganizationSettings> {
    return fetchApi<OrganizationSettings>("/api/settings/organization", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export const httpReportsRepository: ReportsRepository = {
  async getSummary(): Promise<ReportsSummary> {
    return fetchApi<ReportsSummary>("/api/reports/summary");
  },
  async getIncidentAnalytics(period: string) {
    return fetchApi(`/api/reports/incidents/analytics?period=${encodeURIComponent(period)}`);
  },
  async getUptimeSummary(period: string) {
    return fetchApi(`/api/reports/uptime?period=${encodeURIComponent(period)}`);
  },
  async listHistory(): Promise<ListResult<GeneratedReport>> {
    return fetchApi<{ items: GeneratedReport[] }>("/api/reports/history");
  },
  async generate(data: GenerateReportFormValues) {
    return fetchApi<{ report: GeneratedReport; download: ReportDownloadPayload }>(
      "/api/reports/generate",
      { method: "POST", body: JSON.stringify(data) }
    );
  },
  async getDownload(id: string): Promise<ReportDownloadPayload> {
    return fetchApi<ReportDownloadPayload>(`/api/reports/${id}/download`);
  },
};

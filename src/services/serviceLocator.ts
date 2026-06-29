import type {
  AssetRepository,
  CustomerRepository,
  IncidentRepository,
  PlanningProposalRepository,
  ReportsRepository,
  SettingsRepository,
  WorkOrderRepository,
} from "@/services/repositories";
import {
  mockAssetRepository,
  mockCustomerRepository,
  mockIncidentRepository,
  mockSettingsRepository,
} from "@/services/mock/mockRepositories";
import {
  httpAssetRepository,
  httpCustomerRepository,
  httpIncidentRepository,
  httpPlanningProposalRepository,
  httpReportsRepository,
  httpSettingsRepository,
  httpWorkOrderRepository,
} from "@/services/http/httpRepositories";

const useMsw = process.env.NEXT_PUBLIC_USE_MSW !== "false";

export type Services = {
  assets: AssetRepository;
  customers: CustomerRepository;
  incidents: IncidentRepository;
  settings: SettingsRepository;
  workOrders: WorkOrderRepository;
  planning: PlanningProposalRepository;
  reports: ReportsRepository;
};

export const services: Services = {
  assets: useMsw ? mockAssetRepository : httpAssetRepository,
  customers: useMsw ? mockCustomerRepository : httpCustomerRepository,
  incidents: useMsw ? mockIncidentRepository : httpIncidentRepository,
  settings: useMsw ? mockSettingsRepository : httpSettingsRepository,
  workOrders: httpWorkOrderRepository,
  planning: httpPlanningProposalRepository,
  reports: httpReportsRepository,
};

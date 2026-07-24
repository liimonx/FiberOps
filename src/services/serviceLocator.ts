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
  mockPlanningProposalRepository,
  mockReportsRepository,
  mockSettingsRepository,
  mockWorkOrderRepository,
} from "@/services/mock/mockRepositories";

export type Services = {
  assets: AssetRepository;
  customers: CustomerRepository;
  incidents: IncidentRepository;
  settings: SettingsRepository;
  workOrders: WorkOrderRepository;
  planning: PlanningProposalRepository;
  reports: ReportsRepository;
};

/** All repositories use in-memory mock data. */
export const services: Services = {
  assets: mockAssetRepository,
  customers: mockCustomerRepository,
  incidents: mockIncidentRepository,
  settings: mockSettingsRepository,
  workOrders: mockWorkOrderRepository,
  planning: mockPlanningProposalRepository,
  reports: mockReportsRepository,
};

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
  getOrganizationSettings,
  setOrganizationSettings,
} from "@/mocks/settingsData";
import {
  createIncident,
  getIncidentById,
  getIncidents,
  updateIncident,
} from "@/mocks/incidentsData";
import { createAsset, getAssets } from "@/mocks/assetsData";
import { getCustomers } from "@/mocks/customersData";
import {
  createWorkOrder,
  getWorkOrderById,
  getWorkOrders,
  updateWorkOrder,
} from "@/mocks/workOrdersData";
import {
  createPlanningProposal,
  getPlanningProposalById,
  getPlanningProposals,
  updatePlanningProposal,
} from "@/mocks/planningProposalsData";
import {
  generateReport,
  getIncidentAnalytics,
  getReportDownloadById,
  getReportHistory,
  getReportsSummary,
  getUptimeSummary,
} from "@/mocks/reportsData";
import { createLogger } from "@/lib/logger";

const log = createLogger("Mock");

export const mockAssetRepository: AssetRepository = {
  list: async () => {
    const items = getAssets();
    log.info("AssetRepository.list() called, returning", items.length, "assets");
    return { items };
  },
  create: async (data) => {
    log.info("AssetRepository.create() called");
    return createAsset(data);
  },
};

export const mockCustomerRepository: CustomerRepository = {
  list: async () => {
    const items = getCustomers();
    log.info("CustomerRepository.list() called, returning", items.length, "customers");
    return { items };
  },
};

export const mockIncidentRepository: IncidentRepository = {
  list: async () => {
    const items = getIncidents();
    log.info("IncidentRepository.list() called, returning", items.length, "incidents");
    return { items };
  },
  getById: async (id) => {
    log.info("IncidentRepository.getById() called", id);
    return getIncidentById(id) ?? null;
  },
  create: async (data) => {
    log.info("IncidentRepository.create() called");
    return createIncident(data);
  },
  update: async (id, data) => {
    log.info("IncidentRepository.update() called", id);
    return updateIncident(id, data);
  },
};

export const mockSettingsRepository: SettingsRepository = {
  getOrganization: async () => {
    log.info("SettingsRepository.getOrganization() called");
    return getOrganizationSettings();
  },
  updateOrganization: async (data) => {
    log.info("SettingsRepository.updateOrganization() called");
    return setOrganizationSettings(data);
  },
};

export const mockWorkOrderRepository: WorkOrderRepository = {
  list: async () => ({ items: getWorkOrders() }),
  getById: async (id) => getWorkOrderById(id) ?? null,
  create: async (data) => createWorkOrder(data),
  update: async (id, data) => updateWorkOrder(id, data),
};

export const mockPlanningProposalRepository: PlanningProposalRepository = {
  list: async () => ({ items: getPlanningProposals() }),
  getById: async (id) => getPlanningProposalById(id) ?? null,
  create: async (data) => createPlanningProposal(data),
  update: async (id, data) => updatePlanningProposal(id, data),
};

export const mockReportsRepository: ReportsRepository = {
  getSummary: async () => getReportsSummary(),
  getIncidentAnalytics: async (period) => getIncidentAnalytics(period),
  getUptimeSummary: async (period) => getUptimeSummary(period),
  listHistory: async () => ({ items: getReportHistory() }),
  generate: async (data) => generateReport(data),
  getDownload: async (id) => {
    const download = getReportDownloadById(id);
    if (!download) throw new Error("Report not found");
    return download;
  },
};

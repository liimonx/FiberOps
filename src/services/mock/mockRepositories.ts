import type {
  AssetRepository,
  CustomerRepository,
  IncidentRepository,
  SettingsRepository,
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
import { mockAssets, mockCustomers } from "./mockData";
import { createLogger } from "@/lib/logger";

const log = createLogger("Mock");

export const mockAssetRepository: AssetRepository = {
  list: async () => {
    log.info('AssetRepository.list() called, returning', mockAssets.length, 'assets');
    return { items: mockAssets };
  },
};

export const mockCustomerRepository: CustomerRepository = {
  list: async () => {
    log.info('CustomerRepository.list() called, returning', mockCustomers.length, 'customers');
    return { items: mockCustomers };
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


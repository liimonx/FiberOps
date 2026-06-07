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
import { mockAssets, mockCustomers, mockIncidents } from "./mockData";
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
    log.info('IncidentRepository.list() called, returning', mockIncidents.length, 'incidents');
    return { items: mockIncidents };
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


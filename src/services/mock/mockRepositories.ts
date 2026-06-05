import type {
  AssetRepository,
  CustomerRepository,
  IncidentRepository,
} from "@/services/repositories";
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


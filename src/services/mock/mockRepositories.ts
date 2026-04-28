import type {
  AssetRepository,
  CustomerRepository,
  IncidentRepository,
} from "@/services/repositories";
import { mockAssets, mockCustomers, mockIncidents } from "./mockData";

export const mockAssetRepository: AssetRepository = {
  list: async () => {
    console.log('[MockAssetRepository] list() called, returning', mockAssets.length, 'assets');
    return { items: mockAssets };
  },
};

export const mockCustomerRepository: CustomerRepository = {
  list: async () => {
    console.log('[MockCustomerRepository] list() called, returning', mockCustomers.length, 'customers');
    return { items: mockCustomers };
  },
};

export const mockIncidentRepository: IncidentRepository = {
  list: async () => {
    console.log('[MockIncidentRepository] list() called, returning', mockIncidents.length, 'incidents');
    return { items: mockIncidents };
  },
};


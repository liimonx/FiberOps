import type {
  AssetRepository,
  CustomerRepository,
  IncidentRepository,
} from "@/services/repositories";
import { mockAssets, mockCustomers, mockIncidents } from "./mockData";

export const mockAssetRepository: AssetRepository = {
  list: async () => ({ items: mockAssets }),
};

export const mockCustomerRepository: CustomerRepository = {
  list: async () => ({ items: mockCustomers }),
};

export const mockIncidentRepository: IncidentRepository = {
  list: async () => ({ items: mockIncidents }),
};


import type {
  AssetRepository,
  CustomerRepository,
  IncidentRepository,
} from "@/services/repositories";
import {
  mockAssetRepository,
  mockCustomerRepository,
  mockIncidentRepository,
} from "@/services/mock/mockRepositories";

export type Services = {
  assets: AssetRepository;
  customers: CustomerRepository;
  incidents: IncidentRepository;
};

export const services: Services = {
  assets: mockAssetRepository,
  customers: mockCustomerRepository,
  incidents: mockIncidentRepository,
};


import type {
  AssetRepository,
  CustomerRepository,
  IncidentRepository,
  SettingsRepository,
} from "@/services/repositories";
import {
  mockAssetRepository,
  mockCustomerRepository,
  mockIncidentRepository,
  mockSettingsRepository,
} from "@/services/mock/mockRepositories";

export type Services = {
  assets: AssetRepository;
  customers: CustomerRepository;
  incidents: IncidentRepository;
  settings: SettingsRepository;
};

export const services: Services = {
  assets: mockAssetRepository,
  customers: mockCustomerRepository,
  incidents: mockIncidentRepository,
  settings: mockSettingsRepository,
};


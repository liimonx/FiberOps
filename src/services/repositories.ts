import type { Asset, Customer, Incident, OrganizationSettings } from "@/types/domain";

export type ListResult<T> = { items: T[] };

export interface AssetRepository {
  list(): Promise<ListResult<Asset>>;
}

export interface CustomerRepository {
  list(): Promise<ListResult<Customer>>;
}

export interface IncidentRepository {
  list(): Promise<ListResult<Incident>>;
}

export interface SettingsRepository {
  getOrganization(): Promise<OrganizationSettings>;
  updateOrganization(data: OrganizationSettings): Promise<OrganizationSettings>;
}


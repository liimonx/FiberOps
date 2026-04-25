import type { Asset, Customer, Incident } from "@/types/domain";

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


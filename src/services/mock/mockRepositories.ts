import type {
  AssetRepository,
  CustomerRepository,
  IncidentRepository,
} from "@/services/repositories";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export const mockAssetRepository: AssetRepository = {
  list: () => getJson("/api/assets"),
};

export const mockCustomerRepository: CustomerRepository = {
  list: () => getJson("/api/customers"),
};

export const mockIncidentRepository: IncidentRepository = {
  list: () => getJson("/api/incidents"),
};


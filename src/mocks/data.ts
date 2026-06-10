import type { Incident } from "@/types/domain";
import { getAssets } from "@/mocks/assetsData";

// Legacy re-export — runtime assets are served from mocks/assetsData.ts
export const assets = getAssets();

// Legacy seed reference — runtime customers are served from mocks/customersData.ts
// Legacy seed reference — runtime incidents are served from mocks/incidentsData.ts
export const incidents: Incident[] = [];


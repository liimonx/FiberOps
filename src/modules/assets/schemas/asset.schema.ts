import { z } from "zod";
import type { AssetKind, AssetStatus } from "@/types/domain";

export const assetKinds = [
  "pole",
  "junction_box",
  "splitter",
  "onu",
  "pop",
  "fiber_route",
] as const satisfies readonly AssetKind[];

export const assetStatuses = [
  "active",
  "degraded",
  "down",
  "maintenance",
] as const satisfies readonly AssetStatus[];

const locationSchema = z.object({
  lat: z
    .number({ error: "Enter a valid latitude" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90),
  lng: z
    .number({ error: "Enter a valid longitude" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180),
});

export const createAssetSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  kind: z.enum(assetKinds),
  status: z.enum(assetStatuses),
  location: locationSchema,
  monitorHost: z.string().trim().optional(),
});

export type CreateAssetFormValues = z.infer<typeof createAssetSchema>;

export const assetKindLabels: Record<AssetKind, string> = {
  pole: "Pole",
  junction_box: "Junction Box",
  splitter: "Splitter",
  onu: "ONU",
  pop: "PoP",
  fiber_route: "Fiber Route",
};

export const assetStatusLabels: Record<AssetStatus, string> = {
  active: "Active",
  degraded: "Degraded",
  down: "Down",
  maintenance: "Maintenance",
};

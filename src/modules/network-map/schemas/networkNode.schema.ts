import { z } from "zod";
import { NetworkNodeType, NetworkStatus } from "../types";
import { latLngSchema } from "./common.schema";

export { latLngSchema };

export const networkNodeSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)), // Support both UUIDs and simple IDs
  name: z.string().min(1).max(100),
  type: z.nativeEnum(NetworkNodeType),
  position: latLngSchema,
  status: z.nativeEnum(NetworkStatus),
  capacity: z.number().nonnegative().optional(),
  utilization: z.number().min(0).max(100).optional(),
  connectedNodes: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type NetworkNodeSchema = z.infer<typeof networkNodeSchema>;

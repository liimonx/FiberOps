import { z } from "zod";
import { networkNodeSchema } from "./networkNode.schema";
import { networkConnectionSchema } from "./networkConnection.schema";
import { NetworkStatus } from "../types";

export const webSocketMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("node_update"),
    data: z.lazy(() => networkNodeSchema.partial().extend({ id: z.string().min(1) })),
    timestamp: z.string().datetime().optional(),
  }),
  z.object({
    type: z.literal("connection_update"),
    data: z.lazy(() =>
      networkConnectionSchema.partial().extend({ id: z.string().min(1) })
    ),
    timestamp: z.string().datetime().optional(),
  }),
  z.object({
    type: z.literal("incident_alert"),
    data: z.record(z.string(), z.any()),
    timestamp: z.string().datetime().optional(),
  }),
  z.object({
    type: z.literal("status_broadcast"),
    data: z.object({
      nodeId: z.string().min(1),
      status: z.nativeEnum(NetworkStatus),
      timestamp: z.string().datetime(),
    }),
  }),
  z.object({
    type: z.literal("heartbeat"),
    data: z.object({
      serverTime: z.string().datetime(),
      connectedClients: z.number().nonnegative(),
    }),
  }),
]);

export type WebSocketMessageSchema = z.infer<typeof webSocketMessageSchema>;

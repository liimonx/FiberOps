import { z } from 'zod';
import { ConnectionType, NetworkStatus } from '../types';
import { latLngSchema } from './common.schema';

export const networkConnectionSchema = z.object({
  id: z.string().min(1),
  sourceNodeId: z.string().min(1),
  targetNodeId: z.string().min(1),
  type: z.nativeEnum(ConnectionType),
  status: z.nativeEnum(NetworkStatus),
  bandwidth: z.number().nonnegative().optional(),
  utilization: z.number().min(0).max(100).optional(),
  route: z.array(latLngSchema).optional(),
});

export type NetworkConnectionSchema = z.infer<typeof networkConnectionSchema>;

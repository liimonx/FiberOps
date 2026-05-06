import { z } from 'zod';
import { networkNodeSchema } from './networkNode.schema';
import { networkConnectionSchema } from './networkConnection.schema';

export const networkDataSchema = z.object({
  nodes: z.array(networkNodeSchema),
  connections: z.array(networkConnectionSchema),
  lastUpdated: z.string().datetime().optional(),
});

export type NetworkDataSchema = z.infer<typeof networkDataSchema>;

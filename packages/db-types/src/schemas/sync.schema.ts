import { z } from 'zod';

export const SyncItemSchema = z.object({
  localId: z.string().uuid(),
  entityType: z.enum(['order', 'stock_movement', 'cash_session', 'expense']),
  payload: z.record(z.unknown()),
  clientTimestamp: z.string().datetime(),
});

export const SyncPayloadSchema = z.object({
  items: z.array(SyncItemSchema).min(1),
  deviceId: z.string(),
  branchId: z.string().uuid(),
});

export type SyncItemDto = z.infer<typeof SyncItemSchema>;
export type SyncPayloadDto = z.infer<typeof SyncPayloadSchema>;

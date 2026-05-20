import { z } from 'zod';

export const SyncOperationSchema = z.object({
  localId: z.string().uuid(),
  entityType: z.enum(['order', 'payment', 'stock_movement', 'customer', 'expense']),
  entityId: z.string().optional(),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.record(z.unknown()),
  clientTimestamp: z.string().datetime(),
});

export const SyncPushSchema = z.object({
  terminalId: z.string().uuid(),
  operations: z.array(SyncOperationSchema).min(1),
});

export const SyncPullSchema = z.object({
  terminalId: z.string().uuid(),
  lastSyncAt: z.string().datetime(),
  branchId: z.string().uuid(),
});

export type SyncOperationDto = z.infer<typeof SyncOperationSchema>;
export type SyncPushDto = z.infer<typeof SyncPushSchema>;
export type SyncPullDto = z.infer<typeof SyncPullSchema>;

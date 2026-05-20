import { z } from 'zod';

export const AnalyticsSummaryQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  branchId: z.string().uuid().optional(),
});

export type AnalyticsSummaryQueryDto = z.infer<typeof AnalyticsSummaryQuerySchema>;

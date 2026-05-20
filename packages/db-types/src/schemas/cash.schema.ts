import { z } from 'zod';

export const OpenCashSessionSchema = z.object({
  terminalId: z.string().uuid(),
  openingCash: z.number().min(0),
});

export const CloseCashSessionSchema = z.object({
  closingCash: z.number().min(0),
});

export type OpenCashSessionDto = z.infer<typeof OpenCashSessionSchema>;
export type CloseCashSessionDto = z.infer<typeof CloseCashSessionSchema>;

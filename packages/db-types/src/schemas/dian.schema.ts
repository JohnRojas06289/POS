import { z } from 'zod';

export const GenerateInvoiceSchema = z.object({
  orderId: z.string().uuid(),
});

export const CreditNoteSchema = z.object({
  originalOrderId: z.string().uuid(),
  refundOrderId: z.string().uuid(),
  reason: z.string().optional(),
});

export const TaxSummaryQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export type GenerateInvoiceDto = z.infer<typeof GenerateInvoiceSchema>;
export type CreditNoteDto = z.infer<typeof CreditNoteSchema>;
export type TaxSummaryQueryDto = z.infer<typeof TaxSummaryQuerySchema>;

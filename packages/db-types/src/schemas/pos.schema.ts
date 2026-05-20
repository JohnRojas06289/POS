import { z } from 'zod';

export const PaymentMethodEnum = z.enum([
  'cash', 'card', 'nequi', 'daviplata', 'credit_store',
]);

export const PaymentInputSchema = z.object({
  method: PaymentMethodEnum,
  amount: z.number().positive(),
  reference: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const OrderItemInputSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  localId: z.string().uuid().optional(),
  branchId: z.string().uuid(),
  terminalId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(OrderItemInputSchema).min(1),
  payments: z.array(PaymentInputSchema).min(1),
  discountTotal: z.number().min(0).default(0),
  notes: z.string().optional(),
  clientTimestamp: z.string().datetime().optional(),
});

export const RefundSchema = z.object({
  items: z.array(z.object({
    orderItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  refundMethod: PaymentMethodEnum,
  reason: z.string().optional(),
});

export const OrderFiltersSchema = z.object({
  status: z.enum(['pending', 'hold', 'completed', 'cancelled', 'refunded']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cashierId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type PaymentInputDto = z.infer<typeof PaymentInputSchema>;
export type OrderItemInputDto = z.infer<typeof OrderItemInputSchema>;
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type RefundDto = z.infer<typeof RefundSchema>;
export type OrderFiltersDto = z.infer<typeof OrderFiltersSchema>;

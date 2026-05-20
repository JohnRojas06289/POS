import { z } from 'zod';

export const OrderItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  unitCost: z.number().min(0),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(1).default(0),
  notes: z.string().optional(),
});

export const PaymentMethodSchema = z.object({
  method: z.enum(['cash', 'card', 'transfer', 'credit', 'other']),
  amount: z.number().positive(),
  reference: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateOrderSchema = z.object({
  localId: z.string().uuid().optional(),
  branchId: z.string().uuid(),
  terminalId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  items: z.array(OrderItemSchema).min(1),
  payments: z.array(PaymentMethodSchema).min(1),
  discountTotal: z.number().min(0).default(0),
  notes: z.string().optional(),
  clientTimestamp: z.string().datetime().optional(),
});

export type OrderItemDto = z.infer<typeof OrderItemSchema>;
export type PaymentMethodDto = z.infer<typeof PaymentMethodSchema>;
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;

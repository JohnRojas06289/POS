import { z } from 'zod';

export const CreateSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  nit: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  paymentTermsDays: z.number().int().min(0).default(30),
});

export const PurchaseOrderItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().positive(),
});

export const CreatePurchaseOrderSchema = z.object({
  items: z.array(PurchaseOrderItemSchema).min(1),
  expectedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const ReceivePurchaseOrderItemSchema = z.object({
  variantId: z.string().uuid(),
  quantityReceived: z.number().int().positive(),
  actualUnitCost: z.number().positive(),
});

export const ReceivePurchaseOrderSchema = z.object({
  items: z.array(ReceivePurchaseOrderItemSchema).min(1),
});

export type CreateSupplierDto = z.infer<typeof CreateSupplierSchema>;
export type CreatePurchaseOrderDto = z.infer<typeof CreatePurchaseOrderSchema>;
export type ReceivePurchaseOrderDto = z.infer<typeof ReceivePurchaseOrderSchema>;

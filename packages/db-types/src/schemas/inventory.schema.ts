import { z } from 'zod';

export const StockReasonCodeEnum = z.enum([
  'breakage', 'theft', 'personal_use', 'count_correction', 'initial_load',
]);

export const StockMovementTypeEnum = z.enum([
  'purchase', 'sale', 'adjustment', 'refund', 'transfer_in', 'transfer_out', 'expiry',
]);

export const ReceiveStockSchema = z.object({
  variantId: z.string().uuid(),
  branchId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().positive(),
  expiresAt: z.string().datetime().optional(),
  batchNumber: z.string().optional(),
  purchaseOrderId: z.string().uuid().optional(),
});

export const AdjustStockSchema = z.object({
  variantId: z.string().uuid(),
  branchId: z.string().uuid(),
  quantity: z.number().int(),
  reasonCode: StockReasonCodeEnum,
  notes: z.string().optional(),
});

export const TransferStockSchema = z.object({
  variantId: z.string().uuid(),
  fromBranchId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const CreateProductSchema = z.object({
  sku: z.string().min(1).max(100),
  barcode: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  unitPrice: z.number().positive(),
  taxRate: z.number().min(0).max(1).default(0),
  isPerishable: z.boolean().default(false),
  hasVariants: z.boolean().default(false),
  variants: z.array(z.object({
    sku: z.string().min(1),
    barcode: z.string().optional(),
    name: z.string().min(1),
    attributes: z.record(z.string()).default({}),
    unitPrice: z.number().positive(),
    minStock: z.number().int().min(0).default(0),
  })).optional(),
});

export type ReceiveStockDto = z.infer<typeof ReceiveStockSchema>;
export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;
export type TransferStockDto = z.infer<typeof TransferStockSchema>;
export type CreateProductDto = z.infer<typeof CreateProductSchema>;

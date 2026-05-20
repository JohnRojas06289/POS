import { z } from 'zod';

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  attributes: z.record(z.string()),
  unitCost: z.number().min(0),
  unitPrice: z.number().min(0),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  isActive: z.boolean(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  unitCost: z.number().min(0),
  unitPrice: z.number().min(0),
  taxRate: z.number().min(0).max(1),
  isActive: z.boolean(),
  hasVariants: z.boolean(),
  variants: z.array(ProductVariantSchema).optional(),
});

export type ProductDto = z.infer<typeof ProductSchema>;
export type ProductVariantDto = z.infer<typeof ProductVariantSchema>;

import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().optional(),
  documentType: z.enum(['CC', 'NIT', 'CE', 'PP']).optional(),
  documentId: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  creditLimit: z.number().min(0).default(0),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CreditPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'nequi', 'daviplata']),
  reference: z.string().optional(),
});

export type CreateCustomerDto = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof UpdateCustomerSchema>;
export type CreditPaymentDto = z.infer<typeof CreditPaymentSchema>;

import { z } from 'zod';

export const LoginSchema = z.object({
  tenantEmail: z.string().email(),
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginPinSchema = z.object({
  tenantId: z.string().uuid(),
  branchId: z.string().uuid(),
  pin: z.string().min(4).max(8),
});

export const RegisterTenantSchema = z.object({
  tenantName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  ownerName: z.string().min(2).max(100),
  country: z.string().length(2).optional(),
  timezone: z.string().optional(),
  currency: z.string().length(3).optional(),
  businessType: z
    .enum(['retail_clothing', 'restaurant', 'grocery', 'services'])
    .optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type LoginPinDto = z.infer<typeof LoginPinSchema>;
export type RegisterTenantDto = z.infer<typeof RegisterTenantSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

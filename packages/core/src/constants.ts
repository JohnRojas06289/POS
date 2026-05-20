export const PLANS = {
  LITE: 'lite',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  CASHIER: 'cashier',
} as const;

export const BUSINESS_TYPES = {
  RETAIL_CLOTHING: 'retail_clothing',
  RESTAURANT: 'restaurant',
  GROCERY: 'grocery',
  SERVICES: 'services',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  CREDIT: 'credit',
  OTHER: 'other',
} as const;

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  ERROR: 'error',
} as const;

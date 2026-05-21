import { BadRequestException } from '@nestjs/common';

export const TENANT_TEMPLATE_TABLES = [
  'Branch',
  'Terminal',
  'User',
  'TenantConfig',
  'Product',
  'ProductVariant',
  'StockEntry',
  'StockMovement',
  'Order',
  'OrderItem',
  'Payment',
  'CashSession',
  'Customer',
  'CreditTransaction',
  'Supplier',
  'PurchaseOrder',
  'Expense',
  'Employee',
  'PayrollPayment',
  'SyncQueue',
  'AiEvent',
  'DianDocument',
] as const;

export function assertValidSchemaName(schemaName: string): void {
  if (!/^[a-z0-9_]+$/.test(schemaName)) {
    throw new BadRequestException(
      `Invalid schema name: ${schemaName}. Use lowercase letters, numbers, and underscores only.`,
    );
  }
}

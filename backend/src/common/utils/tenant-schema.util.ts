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

type RawQueryExecutor = {
  $queryRawUnsafe: (...args: unknown[]) => Promise<unknown>;
  $executeRawUnsafe: (...args: unknown[]) => Promise<unknown>;
};

export async function ensureTenantSchemaTables(
  executor: RawQueryExecutor,
  schemaName: string,
  tables: readonly string[] = TENANT_TEMPLATE_TABLES,
): Promise<void> {
  assertValidSchemaName(schemaName);

  await executor.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  const rows = await executor.$queryRawUnsafe(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = $1
       AND table_name = ANY($2::text[])`,
    schemaName,
    tables,
  ) as Array<{ table_name: string }>;

  const existing = new Set(rows.map((row) => row.table_name));
  const missing = tables.filter((table) => !existing.has(table));

  for (const table of missing) {
    await executor.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."${table}" (LIKE "tenant"."${table}" INCLUDING ALL)`,
    );
  }
}

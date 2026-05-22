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

type TableNameRow = {
  table_name: string;
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
     WHERE table_schema = $1`,
    schemaName,
  ) as TableNameRow[];

  const existing = new Set(rows.map((row) => row.table_name));
  const missing = tables.filter((table) => !existing.has(table));

  for (const table of missing) {
    const templateExists = await executor.$queryRawUnsafe(
      `SELECT 1 AS has_template
       FROM information_schema.tables
       WHERE table_schema = 'tenant'
         AND table_name = $1
       LIMIT 1`,
      table,
    ) as Array<{ has_template: number }>;

    if (!templateExists[0]) {
      throw new BadRequestException(
        `Tenant template table missing: tenant.${table}`,
      );
    }

    await executor.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."${table}" (LIKE "tenant"."${table}" INCLUDING ALL)`,
    );
  }
}

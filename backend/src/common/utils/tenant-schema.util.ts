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
  'Quote',
  'QuoteItem',
  'Table',
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

// Columns added after initial schema creation that must be backfilled for existing tenants.
const COLUMN_MIGRATIONS: Array<{ table: string; column: string; definition: string }> = [
  { table: 'Order', column: 'tableId', definition: 'TEXT' },
];

export async function ensureTenantSchemaTables(
  executor: RawQueryExecutor,
  schemaName: string,
  tables: readonly string[] = TENANT_TEMPLATE_TABLES,
): Promise<void> {
  assertValidSchemaName(schemaName);

  const schemaExists = await executor.$queryRawUnsafe(
    `SELECT 1 AS has_schema
     FROM information_schema.schemata
     WHERE schema_name = $1
     LIMIT 1`,
    schemaName,
  ) as Array<{ has_schema: number }>;

  if (!schemaExists[0]) {
    await executor.$executeRawUnsafe(`CREATE SCHEMA "${schemaName}"`);
  }

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

  // Backfill columns added to existing tables after initial schema creation.
  for (const { table, column, definition } of COLUMN_MIGRATIONS) {
    if (!existing.has(table)) continue; // newly created above — already has the column
    const columnExists = await executor.$queryRawUnsafe(
      `SELECT 1 AS has_column
       FROM information_schema.columns
       WHERE table_schema = $1
         AND table_name = $2
         AND column_name = $3
       LIMIT 1`,
      schemaName,
      table,
      column,
    ) as Array<{ has_column: number }>;

    if (!columnExists[0]) {
      await executor.$executeRawUnsafe(
        `ALTER TABLE "${schemaName}"."${table}" ADD COLUMN IF NOT EXISTS "${column}" ${definition}`,
      );
    }
  }
}

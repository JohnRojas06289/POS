import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { assertValidSchemaName, ensureTenantSchemaTables } from '../../common/utils/tenant-schema.util';

async function withSchema<T>(
  tx: Prisma.TransactionClient,
  schemaName: string,
  fn: () => Promise<T>,
): Promise<T> {
  await tx.$executeRawUnsafe(`SET LOCAL search_path = "${schemaName}", public`);
  return fn();
}

const VALID_TABLE_STATUSES = ['available', 'occupied', 'reserved'] as const;

type TableRow = {
  id: string;
  branchId: string;
  number: number;
  capacity: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  activeOrderTotal: string | null;
  activeOrderCount: string;
};

type TableView = {
  id: string;
  branchId: string;
  number: number;
  capacity: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  activeOrderTotal: number | null;
};

function mapTableRow(row: TableRow): TableView {
  return {
    id: row.id,
    branchId: row.branchId,
    number: Number(row.number),
    capacity: Number(row.capacity),
    status: row.status,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    activeOrderTotal: Number(row.activeOrderCount) > 0 ? Number(row.activeOrderTotal ?? 0) : null,
  };
}

async function fetchTables(
  tx: Prisma.TransactionClient,
  filters: { id?: string; branchId?: string },
): Promise<TableView[]> {
  const rows = await tx.$queryRaw<TableRow[]>(Prisma.sql`
    SELECT
      t.id,
      t."branchId" AS "branchId",
      t.number,
      t.capacity,
      t.status,
      t.notes,
      t."createdAt" AS "createdAt",
      t."updatedAt" AS "updatedAt",
      COALESCE(SUM(CASE
        WHEN o.status IN ('pending', 'hold') THEN o.total
        ELSE 0
      END), 0)::text AS "activeOrderTotal",
      COUNT(CASE
        WHEN o.status IN ('pending', 'hold') THEN 1
        ELSE NULL
      END)::text AS "activeOrderCount"
    FROM "Table" t
    LEFT JOIN "Order" o ON o."tableId" = t.id
    WHERE 1 = 1
      ${filters.id ? Prisma.sql`AND t.id = ${filters.id}` : Prisma.empty}
      ${filters.branchId ? Prisma.sql`AND t."branchId" = ${filters.branchId}` : Prisma.empty}
    GROUP BY t.id
    ORDER BY t.number ASC
  `);

  return rows.map(mapTableRow);
}

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTableDto, schemaName: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Table', 'Order']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        if (!dto.branchId) {
          throw new BadRequestException('branchId is required to create a table');
        }

        const tableId = uuidv4();

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "Table" (
            id, "branchId", number, capacity, notes, status, "createdAt", "updatedAt"
          ) VALUES (
            ${tableId},
            ${dto.branchId},
            ${dto.number},
            ${dto.capacity ?? 4},
            ${dto.notes ?? null},
            'available',
            NOW(),
            NOW()
          )
        `);

        const [table] = await fetchTables(tx, { id: tableId });
        if (!table) {
          throw new NotFoundException(`Table ${tableId} not found after creation`);
        }
        return table;
      });
    });
  }

  async findAll(schemaName: string, branchId?: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Table', 'Order']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => fetchTables(tx, { branchId }));
    });
  }

  async updateStatus(id: string, status: string, schemaName: string) {
    if (!VALID_TABLE_STATUSES.includes(status as typeof VALID_TABLE_STATUSES[number])) {
      throw new BadRequestException(
        `Invalid status '${status}'. Valid values: ${VALID_TABLE_STATUSES.join(', ')}`,
      );
    }

    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Table', 'Order']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id
          FROM "Table"
          WHERE id = ${id}
          LIMIT 1
        `);

        if (!existing[0]) {
          throw new NotFoundException(`Table ${id} not found`);
        }

        await tx.$executeRaw(Prisma.sql`
          UPDATE "Table"
          SET status = ${status}, "updatedAt" = NOW()
          WHERE id = ${id}
        `);

        const [table] = await fetchTables(tx, { id });
        if (!table) {
          throw new NotFoundException(`Table ${id} not found after update`);
        }
        return table;
      });
    });
  }

  async assignOrder(tableId: string, orderId: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Table', 'Order']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id
          FROM "Table"
          WHERE id = ${tableId}
          LIMIT 1
        `);

        if (!existing[0]) {
          throw new NotFoundException(`Table ${tableId} not found`);
        }

        const order = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id
          FROM "Order"
          WHERE id = ${orderId}
          LIMIT 1
        `);

        if (!order[0]) {
          throw new NotFoundException(`Order ${orderId} not found`);
        }

        await tx.$executeRaw(Prisma.sql`
          UPDATE "Order"
          SET "tableId" = ${tableId}
          WHERE id = ${orderId}
        `);

        await tx.$executeRaw(Prisma.sql`
          UPDATE "Table"
          SET status = 'occupied', "updatedAt" = NOW()
          WHERE id = ${tableId}
        `);

        const [table] = await fetchTables(tx, { id: tableId });
        if (!table) {
          throw new NotFoundException(`Table ${tableId} not found after assignment`);
        }
        return table;
      });
    });
  }

  async releaseTable(tableId: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Table', 'Order']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id
          FROM "Table"
          WHERE id = ${tableId}
          LIMIT 1
        `);

        if (!existing[0]) {
          throw new NotFoundException(`Table ${tableId} not found`);
        }

        await tx.$executeRaw(Prisma.sql`
          UPDATE "Table"
          SET status = 'available', "updatedAt" = NOW()
          WHERE id = ${tableId}
        `);

        const [table] = await fetchTables(tx, { id: tableId });
        if (!table) {
          throw new NotFoundException(`Table ${tableId} not found after release`);
        }
        return table;
      });
    });
  }

  async delete(id: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Table', 'Order']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id
          FROM "Table"
          WHERE id = ${id}
          LIMIT 1
        `);

        if (!existing[0]) {
          throw new NotFoundException(`Table ${id} not found`);
        }

        const activeOrders = await tx.$queryRaw<Array<{ count: string }>>(Prisma.sql`
          SELECT COUNT(*)::text AS count
          FROM "Order"
          WHERE "tableId" = ${id}
            AND status IN ('pending', 'hold')
        `);

        if (Number(activeOrders[0]?.count ?? 0) > 0) {
          throw new BadRequestException(
            `Table ${id} has active orders and cannot be deleted`,
          );
        }

        await tx.$executeRaw(Prisma.sql`
          DELETE FROM "Table"
          WHERE id = ${id}
        `);

        return { id, deleted: true };
      });
    });
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
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

const VALID_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const;

type QuoteRow = {
  id: string;
  branchId: string;
  customerId: string | null;
  customerName: string | null;
  status: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  notes: string | null;
  validUntil: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

type QuoteItemRow = {
  id: string;
  quoteId: string;
  variantId: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  total: string;
};

type QuoteView = {
  id: string;
  branchId: string;
  customerId: string | null;
  customerName: string | null;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  validUntil: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    variantId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
};

function toNumber(value: string | number | Prisma.Decimal | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function mapQuoteRows(rows: QuoteRow[], itemRows: QuoteItemRow[]): QuoteView[] {
  const itemMap = new Map<string, QuoteView['items']>();

  for (const item of itemRows) {
    const current = itemMap.get(item.quoteId) ?? [];
    current.push({
      id: item.id,
      variantId: item.variantId,
      description: item.description,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      discount: toNumber(item.discount),
      total: toNumber(item.total),
    });
    itemMap.set(item.quoteId, current);
  }

  return rows.map((row) => ({
    id: row.id,
    branchId: row.branchId,
    customerId: row.customerId,
    customerName: row.customerName,
    status: row.status,
    subtotal: toNumber(row.subtotal),
    discountTotal: toNumber(row.discountTotal),
    taxTotal: toNumber(row.taxTotal),
    total: toNumber(row.total),
    notes: row.notes,
    validUntil: row.validUntil,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: itemMap.get(row.id) ?? [],
  }));
}

async function fetchQuotesWithItems(
  tx: Prisma.TransactionClient,
  filters: { id?: string; branchId?: string; status?: string },
): Promise<QuoteView[]> {
  const rows = await tx.$queryRaw<QuoteRow[]>(Prisma.sql`
    SELECT
      q.id,
      q."branchId" AS "branchId",
      q."customerId" AS "customerId",
      c.name AS "customerName",
      q.status,
      q.subtotal::text AS subtotal,
      q."discountTotal"::text AS "discountTotal",
      q."taxTotal"::text AS "taxTotal",
      q.total::text AS total,
      q.notes,
      q."validUntil" AS "validUntil",
      q."createdBy" AS "createdBy",
      q."createdAt" AS "createdAt",
      q."updatedAt" AS "updatedAt"
    FROM "Quote" q
    LEFT JOIN "Customer" c ON c.id = q."customerId"
    WHERE 1 = 1
      ${filters.id ? Prisma.sql`AND q.id = ${filters.id}` : Prisma.empty}
      ${filters.branchId ? Prisma.sql`AND q."branchId" = ${filters.branchId}` : Prisma.empty}
      ${filters.status ? Prisma.sql`AND q.status = ${filters.status}` : Prisma.empty}
    ORDER BY q."createdAt" DESC
  `);

  if (rows.length === 0) return [];

  const quoteIds = rows.map((row) => row.id);
  const itemRows = await tx.$queryRaw<QuoteItemRow[]>(Prisma.sql`
    SELECT
      qi.id,
      qi."quoteId" AS "quoteId",
      qi."variantId" AS "variantId",
      qi.description,
      qi.quantity::text AS quantity,
      qi."unitPrice"::text AS "unitPrice",
      qi.discount::text AS discount,
      qi.total::text AS total
    FROM "QuoteItem" qi
    WHERE qi."quoteId" IN (${Prisma.join(quoteIds)})
    ORDER BY qi."quoteId" ASC, qi.id ASC
  `);

  return mapQuoteRows(rows, itemRows);
}

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuoteDto, createdBy: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Quote', 'QuoteItem', 'Customer']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        if (!dto.branchId) {
          throw new BadRequestException('branchId is required to create a quote');
        }

        const discountTotal = dto.discountTotal ?? 0;
        const taxTotal = dto.taxTotal ?? 0;

        const subtotal = dto.items.reduce((sum, item) => {
          const base = item.quantity * item.unitPrice;
          const discountRate = item.discount ?? 0;
          const lineDiscountAmount = base * (discountRate / 100);
          return sum + (base - lineDiscountAmount);
        }, 0);

        const total = subtotal + taxTotal;
        const quoteId = uuidv4();

        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "Quote" (
            id, "branchId", "customerId", status, subtotal, "discountTotal", "taxTotal", total, notes, "validUntil", "createdBy"
          ) VALUES (
            ${quoteId},
            ${dto.branchId},
            ${dto.customerId ?? null},
            'draft',
            ${subtotal},
            ${discountTotal},
            ${taxTotal},
            ${total},
            ${dto.notes ?? null},
            ${dto.validUntil ? new Date(dto.validUntil) : null},
            ${createdBy}
          )
        `);

        for (const item of dto.items) {
          const base = item.quantity * item.unitPrice;
          const discountRate = item.discount ?? 0;
          const itemTotal = base - (base * discountRate / 100);

          await tx.$executeRaw(Prisma.sql`
            INSERT INTO "QuoteItem" (
              id, "quoteId", "variantId", description, quantity, "unitPrice", discount, total
            ) VALUES (
              ${uuidv4()},
              ${quoteId},
              ${item.variantId ?? null},
              ${item.description},
              ${item.quantity},
              ${item.unitPrice},
              ${discountRate},
              ${itemTotal}
            )
          `);
        }

        const [quote] = await fetchQuotesWithItems(tx, { id: quoteId });
        if (!quote) {
          throw new NotFoundException(`Quote ${quoteId} not found after creation`);
        }
        return quote;
      });
    });
  }

  async findAll(schemaName: string, branchId?: string, status?: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Quote', 'QuoteItem', 'Customer']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => fetchQuotesWithItems(tx, { branchId, status }));
    });
  }

  async findOne(id: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Quote', 'QuoteItem', 'Customer']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const [quote] = await fetchQuotesWithItems(tx, { id });
        if (!quote) {
          throw new NotFoundException(`Quote ${id} not found`);
        }
        return quote;
      });
    });
  }

  async updateStatus(id: string, status: string, schemaName: string) {
    if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      throw new BadRequestException(
        `Invalid status '${status}'. Valid values: ${VALID_STATUSES.join(', ')}`,
      );
    }

    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Quote', 'QuoteItem', 'Customer']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id
          FROM "Quote"
          WHERE id = ${id}
          LIMIT 1
        `);

        if (!existing[0]) {
          throw new NotFoundException(`Quote ${id} not found`);
        }

        await tx.$executeRaw(Prisma.sql`
          UPDATE "Quote"
          SET status = ${status}, "updatedAt" = NOW()
          WHERE id = ${id}
        `);

        const [quote] = await fetchQuotesWithItems(tx, { id });
        if (!quote) {
          throw new NotFoundException(`Quote ${id} not found after update`);
        }
        return quote;
      });
    });
  }

  async convertToOrder(id: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    await ensureTenantSchemaTables(this.prisma, schemaName, ['Quote', 'QuoteItem', 'Customer']);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT id
          FROM "Quote"
          WHERE id = ${id}
          LIMIT 1
        `);

        if (!existing[0]) {
          throw new NotFoundException(`Quote ${id} not found`);
        }

        await tx.$executeRaw(Prisma.sql`
          UPDATE "Quote"
          SET status = 'accepted', "updatedAt" = NOW()
          WHERE id = ${id}
        `);

        const [quote] = await fetchQuotesWithItems(tx, { id });
        if (!quote) {
          throw new NotFoundException(`Quote ${id} not found after conversion`);
        }
        return quote;
      });
    });
  }
}

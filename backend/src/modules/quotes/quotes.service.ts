import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

async function withSchema<T>(
  tx: Prisma.TransactionClient,
  schemaName: string,
  fn: () => Promise<T>,
): Promise<T> {
  await tx.$executeRawUnsafe(`SET LOCAL search_path = "${schemaName}", public`);
  return fn();
}

const VALID_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuoteDto, createdBy: string, schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const discountTotal = dto.discountTotal ?? 0;
        const taxTotal = dto.taxTotal ?? 0;

        const subtotal = dto.items.reduce((sum, item) => {
          const itemDiscount = item.discount ?? 0;
          return sum + (item.quantity * item.unitPrice - itemDiscount);
        }, 0);

        const total = subtotal - discountTotal + taxTotal;

        const quoteId = uuidv4();

        const quote = await tx.quote.create({
          data: {
            id: quoteId,
            branchId: dto.branchId,
            customerId: dto.customerId ?? null,
            status: 'draft',
            subtotal,
            discountTotal,
            taxTotal,
            total,
            notes: dto.notes ?? null,
            validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
            createdBy,
            items: {
              create: dto.items.map((item) => {
                const itemDiscount = item.discount ?? 0;
                const itemTotal = item.quantity * item.unitPrice - itemDiscount;
                return {
                  id: uuidv4(),
                  variantId: item.variantId ?? null,
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: itemDiscount,
                  total: itemTotal,
                };
              }),
            },
          },
          include: {
            items: true,
            customer: true,
          },
        });

        return quote;
      });
    });
  }

  async findAll(schemaName: string, branchId?: string, status?: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const where: Prisma.QuoteWhereInput = {};
        if (branchId) where.branchId = branchId;
        if (status) where.status = status;

        return tx.quote.findMany({
          where,
          include: {
            customer: true,
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      });
    });
  }

  async findOne(id: string, schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const quote = await tx.quote.findUnique({
          where: { id },
          include: {
            customer: true,
            items: true,
          },
        });

        if (!quote) {
          throw new NotFoundException(`Quote ${id} not found`);
        }

        return quote;
      });
    });
  }

  async updateStatus(id: string, status: string, schemaName: string) {
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Valid values: ${VALID_STATUSES.join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.quote.findUnique({ where: { id } });
        if (!existing) {
          throw new NotFoundException(`Quote ${id} not found`);
        }

        return tx.quote.update({
          where: { id },
          data: { status },
        });
      });
    });
  }

  async convertToOrder(id: string, schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.quote.findUnique({
          where: { id },
          include: { items: true, customer: true },
        });

        if (!existing) {
          throw new NotFoundException(`Quote ${id} not found`);
        }

        return tx.quote.update({
          where: { id },
          data: { status: 'accepted' },
          include: { items: true, customer: true },
        });
      });
    });
  }
}

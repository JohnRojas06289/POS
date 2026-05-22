import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
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

const VALID_TABLE_STATUSES = ['available', 'occupied', 'reserved'];
const ACTIVE_ORDER_STATUSES = ['pending', 'hold'];

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTableDto, schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        return tx.table.create({
          data: {
            id: uuidv4(),
            branchId: dto.branchId,
            number: dto.number,
            capacity: dto.capacity ?? 4,
            notes: dto.notes ?? null,
            status: 'available',
          },
        });
      });
    });
  }

  async findAll(schemaName: string, branchId?: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const where: Prisma.TableWhereInput = {};
        if (branchId) where.branchId = branchId;

        return tx.table.findMany({
          where,
          include: {
            orders: {
              where: {
                status: { in: ACTIVE_ORDER_STATUSES },
              },
              select: {
                id: true,
                status: true,
                total: true,
                createdAt: true,
              },
            },
          },
          orderBy: { number: 'asc' },
        });
      });
    });
  }

  async updateStatus(id: string, status: string, schemaName: string) {
    if (!VALID_TABLE_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Invalid status '${status}'. Valid values: ${VALID_TABLE_STATUSES.join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.table.findUnique({ where: { id } });
        if (!existing) {
          throw new NotFoundException(`Table ${id} not found`);
        }

        return tx.table.update({
          where: { id },
          data: { status },
        });
      });
    });
  }

  async assignOrder(tableId: string, orderId: string, schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.table.findUnique({ where: { id: tableId } });
        if (!existing) {
          throw new NotFoundException(`Table ${tableId} not found`);
        }

        return tx.table.update({
          where: { id: tableId },
          data: { status: 'occupied' },
        });
      });
    });
  }

  async releaseTable(tableId: string, schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.table.findUnique({ where: { id: tableId } });
        if (!existing) {
          throw new NotFoundException(`Table ${tableId} not found`);
        }

        return tx.table.update({
          where: { id: tableId },
          data: { status: 'available' },
        });
      });
    });
  }

  async delete(id: string, schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const existing = await tx.table.findUnique({
          where: { id },
          include: {
            orders: {
              where: {
                status: { in: ACTIVE_ORDER_STATUSES },
              },
              select: { id: true },
            },
          },
        });

        if (!existing) {
          throw new NotFoundException(`Table ${id} not found`);
        }

        if (existing.orders.length > 0) {
          throw new BadRequestException(
            `Table ${id} has active orders and cannot be deleted`,
          );
        }

        return tx.table.delete({ where: { id } });
      });
    });
  }
}

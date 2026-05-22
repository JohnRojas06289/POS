import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
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

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExpenseDto, createdBy: string, branchIdFromJwt?: string | null) {
    const branchId = dto.branchId ?? branchIdFromJwt;
    if (!branchId) {
      throw new BadRequestException('branchId is required');
    }

    return this.prisma.expense.create({
      data: {
        id: uuidv4(),
        branchId,
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        receiptUrl: dto.receiptUrl,
        isPaid: dto.isPaid ?? true,
        createdBy,
      },
    });
  }

  async findAll(filters: { category?: string; branchId?: string; from?: string; to?: string }) {
    const where: Prisma.ExpenseWhereInput = {};
    if (filters.category) where.category = filters.category;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async markAsPaid(expenseId: string, schemaName: string) {
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        return tx.expense.update({
          where: { id: expenseId },
          data: { isPaid: true },
        });
      });
    });
  }

  async getSummary(filters: { branchId?: string; from?: string; to?: string }) {
    const expenses = await this.findAll(filters);
    const byCategory = new Map<string, number>();

    let total = 0;
    for (const expense of expenses) {
      const amount = Number(expense.amount);
      total += amount;
      byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + amount);
    }

    return {
      total,
      count: expenses.length,
      byCategory: Array.from(byCategory.entries()).map(([category, amount]) => ({
        category,
        amount,
      })),
      expenses,
    };
  }
}

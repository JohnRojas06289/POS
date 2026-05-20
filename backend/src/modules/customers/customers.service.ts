import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, CreditPaymentDto } from './dto/create-customer.dto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        id: uuidv4(),
        name: dto.name,
        phone: dto.phone,
        documentType: dto.documentType,
        documentNum: dto.documentId,
        email: dto.email,
        address: dto.address,
        creditLimit: dto.creditLimit ?? 0,
        creditBalance: 0,
      },
    });
  }

  async findAll(filters: { search?: string; hasDebt?: boolean }) {
    const where: Prisma.CustomerWhereInput = { isActive: true };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { documentNum: { contains: filters.search } },
      ];
    }
    if (filters.hasDebt === true) {
      where.creditBalance = { gt: 0 };
    } else if (filters.hasDebt === false) {
      where.creditBalance = { equals: 0 };
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Aggregate total purchases per customer
    const purchaseCounts = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customers.map((c) => c.id) }, status: 'completed' },
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
    });

    return customers.map((c) => {
      const stats = purchaseCounts.find((p) => p.customerId === c.id);
      return {
        ...c,
        totalPurchases: Number(stats?._sum.total ?? 0),
        purchaseCount: stats?._count.id ?? 0,
        lastPurchaseAt: stats?._max.createdAt ?? null,
      };
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);

    const [creditTransactions, recentOrders] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.order.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { payments: true },
      }),
    ]);

    return { ...customer, creditTransactions, recentOrders };
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async payCredit(id: string, dto: CreditPaymentDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);

    if (dto.amount > Number(customer.creditBalance)) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds current balance (${customer.creditBalance}). Customer cannot overpay.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const newBalance = Number(customer.creditBalance) - dto.amount;

      await tx.customer.update({
        where: { id },
        data: { creditBalance: newBalance },
      });

      const transaction = await tx.creditTransaction.create({
        data: {
          id: uuidv4(),
          customerId: id,
          type: 'payment',
          amount: dto.amount,
          balance: newBalance,
          referenceId: dto.reference,
          notes: `Pago ${dto.paymentMethod}${dto.reference ? ` ref:${dto.reference}` : ''}`,
        },
      });

      return { transaction, newBalance, previousBalance: Number(customer.creditBalance) };
    });
  }

  async getCreditStatement(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);

    const transactions = await this.prisma.creditTransaction.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'asc' },
    });

    const oldestUnpaidCharge = transactions
      .filter((t) => t.type === 'charge' || t.type === 'purchase')
      .find((t) => Number(t.amount) > 0);

    const totalCharged = transactions
      .filter((t) => t.type !== 'payment')
      .reduce((s, t) => s + Number(t.amount), 0);

    const totalPaid = transactions
      .filter((t) => t.type === 'payment')
      .reduce((s, t) => s + Number(t.amount), 0);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        creditLimit: Number(customer.creditLimit),
        currentBalance: Number(customer.creditBalance),
        availableCredit: Math.max(0, Number(customer.creditLimit) - Number(customer.creditBalance)),
      },
      totalCharged,
      totalPaid,
      currentDebt: Number(customer.creditBalance),
      oldestUnpaidChargeAt: oldestUnpaidCharge?.createdAt ?? null,
      transactions,
    };
  }

  /**
   * Called by PosService before creating a credit_store order.
   * Validates credit limit is not exceeded.
   */
  async validateCreditPurchase(customerId: string, amount: number): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException(`Customer ${customerId} not found`);

    const limit = Number(customer.creditLimit);
    if (limit === 0) return; // no limit configured — allow

    const currentBalance = Number(customer.creditBalance);
    if (currentBalance + amount > limit) {
      throw new BadRequestException(
        `Credit limit exceeded: limit ${limit}, current balance ${currentBalance}, requested ${amount}. ` +
        `Available credit: ${limit - currentBalance}`,
      );
    }
  }
}

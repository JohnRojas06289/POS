import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OpenCashSessionDto } from './dto/open-session.dto';
import { CloseCashSessionDto } from './dto/close-session.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  async openSession(dto: OpenCashSessionDto, cashierId: string, branchId: string) {
    // Enforce single open session per terminal
    const existing = await this.prisma.cashSession.findFirst({
      where: { terminalId: dto.terminalId, status: 'open' },
    });
    if (existing) {
      throw new ConflictException(
        `Terminal ${dto.terminalId} already has an open cash session: ${existing.id}`,
      );
    }

    return this.prisma.cashSession.create({
      data: {
        id: uuidv4(),
        branchId,
        terminalId: dto.terminalId,
        cashierId,
        status: 'open',
        openingAmount: dto.openingCash,
        openedAt: new Date(),
      },
    });
  }

  async getCurrentSession(terminalId: string) {
    const session = await this.prisma.cashSession.findFirst({
      where: { terminalId, status: 'open' },
    });
    if (!session) throw new NotFoundException('No open cash session for this terminal');
    return session;
  }

  async closeSession(sessionId: string, dto: CloseCashSessionDto) {
    const session = await this.prisma.cashSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException(`Cash session ${sessionId} not found`);
    if (session.status !== 'open') {
      throw new BadRequestException(`Cash session is already ${session.status}`);
    }

    // Calculate expected cash: opening + cash sales - cash refunds
    const payments = await this.prisma.payment.findMany({
      where: {
        method: 'cash',
        order: {
          branchId: session.branchId,
          createdAt: { gte: session.openedAt },
        },
      },
    });

    const expectedCash =
      Number(session.openingAmount) +
      payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const difference = dto.closingCash - expectedCash;

    return this.prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        status: 'closed',
        closingAmount: dto.closingCash,
        expectedAmount: expectedCash,
        difference,
        closedAt: new Date(),
      },
    });
  }

  async getSessionSummary(sessionId: string) {
    const session = await this.prisma.cashSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException(`Cash session ${sessionId} not found`);

    // Sales by payment method during this session
    const orders = await this.prisma.order.findMany({
      where: {
        branchId: session.branchId,
        createdAt: { gte: session.openedAt, lte: session.closedAt ?? new Date() },
        status: { in: ['completed', 'refunded'] },
      },
      include: { payments: true },
    });

    const byMethod: Record<string, number> = {};
    let totalSales = 0;
    let totalRefunds = 0;

    for (const order of orders) {
      for (const payment of order.payments) {
        const amount = Number(payment.amount);
        byMethod[payment.method] = (byMethod[payment.method] ?? 0) + amount;
        if (amount > 0) totalSales += amount;
        else totalRefunds += Math.abs(amount);
      }
    }

    const ordersOnHold = await this.prisma.order.count({
      where: {
        branchId: session.branchId,
        status: 'hold',
        createdAt: { gte: session.openedAt },
      },
    });

    return {
      session,
      totalOrders: orders.length,
      totalSales,
      totalRefunds,
      byMethod,
      ordersOnHold,
      expectedCash: session.expectedAmount,
      closingCash: session.closingAmount,
      difference: session.difference,
    };
  }
}

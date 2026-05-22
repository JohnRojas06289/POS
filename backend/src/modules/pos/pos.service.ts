import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { RefundOrderDto } from './dto/refund-order.dto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { assertValidSchemaName } from '../../common/utils/tenant-schema.util';

interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  cashierId?: string;
  limit?: number;
  cursor?: string;
  branchId: string;
}

export interface OrderSummary {
  id: string;
  localId: string | null;
  branchId: string;
  terminalId: string | null;
  cashierId: string;
  customerId: string | null;
  status: string;
  subtotal: Prisma.Decimal;
  discountTotal: Prisma.Decimal;
  taxTotal: Prisma.Decimal;
  total: Prisma.Decimal;
  notes: string | null;
  createdAt: Date;
  items: unknown[];
  payments: unknown[];
  changeDue?: number;
}

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto, cashierId: string, schemaName: string): Promise<OrderSummary> {
    assertValidSchemaName(schemaName);
    const normalizedPayments = dto.payments.map((payment) => ({
      ...payment,
      method: payment.method === 'credit' ? 'credit_store' : payment.method,
    }));

    await this.prisma.$executeRawUnsafe(`SET search_path = "${schemaName}", public`);

    // Idempotent offline orders: same localId returns the first successful result
    if (dto.localId) {
      const existing = await this.prisma.order.findUnique({
        where: { localId: dto.localId },
        include: { items: true, payments: true },
      });
      if (existing) {
        await this.prisma.$executeRawUnsafe('SET search_path = public');
        return existing as unknown as OrderSummary;
      }
    }

    // Validate and compute totals
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
    });

    if (variants.length !== variantIds.length) {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new BadRequestException('One or more product variants not found or inactive');
    }

    // Check stock availability
    for (const item of dto.items) {
      const variant = variants.find((v) => v.id === item.variantId)!;
      if (variant.stock < item.quantity) {
        await this.prisma.$executeRawUnsafe('SET search_path = public');
        throw new BadRequestException(
          `Insufficient stock for variant ${variant.sku}: available ${variant.stock}, requested ${item.quantity}`,
        );
      }
    }

    // Build order totals
    const itemsWithCost = dto.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const lineSubtotal = item.unitPrice * item.quantity;
      const lineDiscount = item.discount ?? 0;
      const lineTax = (lineSubtotal - lineDiscount) * Number(variant.stock >= 0 ? 0 : 0); // tax rate from product
      const lineTotal = lineSubtotal - lineDiscount + lineTax;
      return {
        item,
        variant,
        lineSubtotal,
        lineDiscount,
        lineTax,
        lineTotal,
        unitCost: Number(variant.unitCost),
      };
    });

    const subtotal = itemsWithCost.reduce((s, r) => s + r.lineSubtotal, 0);
    const discountTotal = (dto.discountTotal ?? 0) + itemsWithCost.reduce((s, r) => s + r.lineDiscount, 0);
    const taxTotal = itemsWithCost.reduce((s, r) => s + r.lineTax, 0);
    const total = subtotal - discountTotal + taxTotal;

    // Validate payments sum
    const paymentsSum = normalizedPayments.reduce((s, p) => s + p.amount, 0);
    const changeDue = Math.max(0, parseFloat((paymentsSum - total).toFixed(2)));
    const cashPaid = normalizedPayments
      .filter((payment) => payment.method === 'cash')
      .reduce((sum, payment) => sum + payment.amount, 0);

    if (paymentsSum + 0.01 < total) {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new BadRequestException(
        `Payments total (${paymentsSum}) does not cover order total (${total})`,
      );
    }
    if (changeDue > 0.01 && cashPaid + 0.01 < changeDue) {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new BadRequestException(
        `Change due (${changeDue}) exceeds cash received (${cashPaid})`,
      );
    }

    const creditStoreAmount = normalizedPayments
      .filter((payment) => payment.method === 'credit_store')
      .reduce((sum, payment) => sum + payment.amount, 0);

    if (creditStoreAmount > 0) {
      if (!dto.customerId) {
        await this.prisma.$executeRawUnsafe('SET search_path = public');
        throw new BadRequestException(
          'credit_store requires a customerId to validate creditLimit',
        );
      }

      const customer = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        await this.prisma.$executeRawUnsafe('SET search_path = public');
        throw new NotFoundException(`Customer ${dto.customerId} not found`);
      }

      const creditLimit = Number(customer.creditLimit);
      const currentBalance = Number(customer.creditBalance);
      if (creditLimit > 0 && currentBalance + creditStoreAmount > creditLimit) {
        await this.prisma.$executeRawUnsafe('SET search_path = public');
        throw new BadRequestException(
          `Credit limit exceeded: limit ${creditLimit}, current balance ${currentBalance}, requested ${creditStoreAmount}`,
        );
      }
    }

    const orderId = uuidv4();

    const order = await this.prisma.$transaction(async (tx) => {
      await (tx as unknown as PrismaService).$executeRawUnsafe(`SET search_path = "${schemaName}", public`);

      // Create order
      const created = await tx.order.create({
        data: {
          id: orderId,
          localId: dto.localId,
          branchId: dto.branchId,
          terminalId: dto.terminalId,
          cashierId,
          customerId: dto.customerId,
          status: 'completed',
          subtotal,
          discountTotal,
          taxTotal,
          total,
          notes: dto.notes,
          clientTimestamp: dto.clientTimestamp ? new Date(dto.clientTimestamp) : null,
          syncedAt: dto.localId ? new Date() : null,
          items: {
            create: itemsWithCost.map(({ item, lineDiscount, lineTotal, unitCost }) => ({
              id: uuidv4(),
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost,
              discount: lineDiscount,
              taxRate: 0,
              total: lineTotal,
              notes: item.notes,
            })),
          },
          payments: {
            create: normalizedPayments.map((p) => ({
              id: uuidv4(),
              method: p.method,
              amount: p.amount,
              reference: p.reference,
              metadata: p.method === 'cash' && changeDue > 0
                ? { changeDue }
                : {},
            })),
          },
        },
        include: { items: true, payments: true },
      });

      // Deduct stock and create immutable stock_movements
      for (const { item, variant } of itemsWithCost) {
        const prevQty = variant.stock;
        const newQty = prevQty - item.quantity;

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: newQty },
        });

        await tx.stockMovement.create({
          data: {
            id: uuidv4(),
            variantId: item.variantId,
            type: 'sale',
            quantity: -item.quantity,
            previousQty: prevQty,
            newQty,
            referenceId: orderId,
            referenceType: 'order',
            createdBy: cashierId,
          },
        });
      }

      // Handle credit_store payments
      for (const payment of normalizedPayments) {
        if (payment.method === 'credit_store' && dto.customerId) {
          await tx.creditTransaction.create({
            data: {
              id: uuidv4(),
              customerId: dto.customerId,
              type: 'purchase',
              amount: payment.amount,
              balance: 0, // will be recomputed by trigger or next query
              referenceId: orderId,
              notes: `Venta a crédito`,
            },
          });

          await tx.customer.update({
            where: { id: dto.customerId },
            data: { creditBalance: { increment: payment.amount } },
          });
        }
      }

      return created;
    });

    await this.prisma.$executeRawUnsafe('SET search_path = public');

    return {
      ...(order as unknown as OrderSummary),
      changeDue,
    };
  }

  async listOrders(filters: OrderFilters, schemaName: string) {
    assertValidSchemaName(schemaName);
    await this.prisma.$executeRawUnsafe(`SET search_path = "${schemaName}", public`);

    const where: Prisma.OrderWhereInput = {
      branchId: filters.branchId,
    };

    if (filters.status) where.status = filters.status;
    if (filters.cashierId) where.cashierId = filters.cashierId;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
      if (filters.dateTo) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(filters.dateTo);
    }
    if (filters.cursor) {
      where.id = { gt: filters.cursor };
    }

    const limit = filters.limit ?? 20;

    const orders = await this.prisma.order.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: { items: true, payments: true },
    });

    await this.prisma.$executeRawUnsafe('SET search_path = public');

    const hasMore = orders.length > limit;
    const data = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, nextCursor, hasMore };
  }

  async getOrder(id: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    await this.prisma.$executeRawUnsafe(`SET search_path = "${schemaName}", public`);
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    await this.prisma.$executeRawUnsafe('SET search_path = public');
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async holdOrder(id: string, schemaName: string): Promise<{ id: string; status: string }> {
    assertValidSchemaName(schemaName);
    await this.prisma.$executeRawUnsafe(`SET search_path = "${schemaName}", public`);
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (!['pending', 'completed'].includes(order.status)) {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new BadRequestException(`Order status '${order.status}' cannot be put on hold`);
    }
    const result = await this.prisma.order.update({
      where: { id },
      data: { status: 'hold' },
      select: { id: true, status: true },
    });
    await this.prisma.$executeRawUnsafe('SET search_path = public');
    return result;
  }

  async resumeOrder(id: string, schemaName: string): Promise<{ id: string; status: string }> {
    assertValidSchemaName(schemaName);
    await this.prisma.$executeRawUnsafe(`SET search_path = "${schemaName}", public`);
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (order.status !== 'hold') {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new BadRequestException(`Order status is '${order.status}', not 'hold'`);
    }
    const result = await this.prisma.order.update({
      where: { id },
      data: { status: 'pending' },
      select: { id: true, status: true },
    });
    await this.prisma.$executeRawUnsafe('SET search_path = public');
    return result;
  }

  async refundOrder(orderId: string, dto: RefundOrderDto, cashierId: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    await this.prisma.$executeRawUnsafe(`SET search_path = "${schemaName}", public`);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.status === 'cancelled') {
      await this.prisma.$executeRawUnsafe('SET search_path = public');
      throw new BadRequestException('Cannot refund a cancelled order');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await (tx as unknown as PrismaService).$executeRawUnsafe(`SET search_path = "${schemaName}", public`);
      let refundTotal = 0;

      for (const refundItem of dto.items) {
        const orderItem = order.items.find((i) => i.id === refundItem.orderItemId);
        if (!orderItem) {
          throw new BadRequestException(`OrderItem ${refundItem.orderItemId} not in order`);
        }
        if (refundItem.quantity > orderItem.quantity) {
          throw new BadRequestException(
            `Refund qty ${refundItem.quantity} exceeds sold qty ${orderItem.quantity}`,
          );
        }

        const variant = await tx.productVariant.findUnique({
          where: { id: orderItem.variantId },
        });
        if (!variant) throw new NotFoundException(`Variant ${orderItem.variantId} not found`);

        const prevQty = variant.stock;
        const newQty = prevQty + refundItem.quantity;

        await tx.productVariant.update({
          where: { id: orderItem.variantId },
          data: { stock: newQty },
        });

        await tx.stockMovement.create({
          data: {
            id: uuidv4(),
            variantId: orderItem.variantId,
            type: 'refund',
            quantity: refundItem.quantity,
            previousQty: prevQty,
            newQty,
            reason: dto.reason,
            referenceId: orderId,
            referenceType: 'refund',
            createdBy: cashierId,
          },
        });

        const refundItemTotal =
          (Number(orderItem.unitPrice) * refundItem.quantity) -
          (Number(orderItem.discount) * (refundItem.quantity / orderItem.quantity));
        refundTotal += refundItemTotal;
      }

      // Create refund payment record
      await tx.payment.create({
        data: {
          id: uuidv4(),
          orderId,
          method: dto.refundMethod,
          amount: -refundTotal,
          reference: `REFUND-${orderId.slice(0, 8)}`,
        },
      });

      const isFullRefund = dto.items.every((ri) => {
        const item = order.items.find((i) => i.id === ri.orderItemId)!;
        return ri.quantity === item.quantity;
      }) && dto.items.length === order.items.length;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: isFullRefund ? 'refunded' : order.status },
        include: { items: true, payments: true },
      });

      return { order: updatedOrder, refundTotal };
    });

    await this.prisma.$executeRawUnsafe('SET search_path = public');
    return result;
  }

  getStatus() {
    return { module: 'pos', status: 'active' };
  }
}

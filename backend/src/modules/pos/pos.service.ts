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

// SET LOCAL is automatically reverted at transaction end — safe for connection pools.
async function withSchema<T>(
  tx: Prisma.TransactionClient,
  schemaName: string,
  fn: () => Promise<T>,
): Promise<T> {
  await tx.$executeRawUnsafe(`SET LOCAL search_path = "${schemaName}", public`);
  return fn();
}

interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  cashierId?: string;
  origin?: string;
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

function readPaymentMetadataNumber(metadata: unknown, key: 'changeDue' | 'tipAmount' | 'tipPercentage'): number {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 0;
  const raw = (metadata as Record<string, unknown>)[key];
  const value = typeof raw === 'number' ? raw : Number(raw ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function extractOrderFinancials(payments: Array<{ amount: Prisma.Decimal | number; metadata: unknown }>) {
  const tipAmount = payments.reduce(
    (max, payment) => Math.max(max, readPaymentMetadataNumber(payment.metadata, 'tipAmount')),
    0,
  );
  const tipPercentage = payments.reduce(
    (max, payment) => Math.max(max, readPaymentMetadataNumber(payment.metadata, 'tipPercentage')),
    0,
  );
  const changeDue = payments.reduce(
    (max, payment) => Math.max(max, readPaymentMetadataNumber(payment.metadata, 'changeDue')),
    0,
  );
  const paidTotal = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return {
    tipAmount,
    tipPercentage: tipPercentage > 0 ? tipPercentage : null,
    changeDue,
    chargedTotal: Math.max(0, paidTotal - changeDue),
  };
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

    // Run everything inside a single transaction so SET LOCAL is safe
    const { order, changeDue } = await this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        // Idempotent offline orders
        if (dto.localId) {
          const existing = await tx.order.findUnique({
            where: { localId: dto.localId },
            include: { items: true, payments: true },
          });
          if (existing) return { order: existing, changeDue: 0 };
        }

        // Venta libre: no items, no stock checks
        if (dto.isFreeEntry) {
          if (dto.items && dto.items.length > 0) {
            throw new BadRequestException('isFreeEntry orders must not contain items');
          }
        }

        const variantIds = dto.isFreeEntry ? [] : dto.items.map((i) => i.variantId);
        const variants = dto.isFreeEntry
          ? []
          : await tx.productVariant.findMany({
              where: { id: { in: variantIds }, isActive: true },
            });

        if (!dto.isFreeEntry && variants.length !== variantIds.length) {
          throw new BadRequestException('One or more product variants not found or inactive');
        }

        if (!dto.isFreeEntry) {
          for (const item of dto.items) {
            const variant = variants.find((v) => v.id === item.variantId)!;
            if (variant.stock < item.quantity) {
              throw new BadRequestException(
                `Insufficient stock for variant ${variant.sku}: available ${variant.stock}, requested ${item.quantity}`,
              );
            }
          }
        }

        const itemsWithCost = dto.isFreeEntry
          ? []
          : dto.items.map((item) => {
              const variant = variants.find((v) => v.id === item.variantId)!;
              const lineSubtotal = item.unitPrice * item.quantity;
              const lineDiscount = item.discount ?? 0;
              const lineTax = 0; // tax rate from product config — kept for future use
              const lineTotal = lineSubtotal - lineDiscount + lineTax;
              return { item, variant, lineSubtotal, lineDiscount, lineTax, lineTotal, unitCost: Number(variant.unitCost) };
            });

        const subtotal = itemsWithCost.reduce((s, r) => s + r.lineSubtotal, 0);
        const discountTotal = (dto.discountTotal ?? 0) + itemsWithCost.reduce((s, r) => s + r.lineDiscount, 0);
        const taxTotal = itemsWithCost.reduce((s, r) => s + r.lineTax, 0);
        const tipAmount = Number((dto.tipAmount ?? 0).toFixed(2));
        const tipPercentage = dto.tipPercentage !== undefined ? Number(dto.tipPercentage) : undefined;
        if (!Number.isFinite(tipAmount) || tipAmount < 0) {
          throw new BadRequestException('tipAmount must be a valid non-negative number');
        }
        if (tipPercentage !== undefined && (!Number.isFinite(tipPercentage) || tipPercentage < 0)) {
          throw new BadRequestException('tipPercentage must be a valid non-negative number');
        }

        const total = subtotal - discountTotal + taxTotal;
        const payableTotal = total + tipAmount;

        const paymentsSum = normalizedPayments.reduce((s, p) => s + p.amount, 0);
        const changeDue = Math.max(0, parseFloat((paymentsSum - payableTotal).toFixed(2)));
        const cashPaid = normalizedPayments
          .filter((p) => p.method === 'cash')
          .reduce((sum, p) => sum + p.amount, 0);

        if (paymentsSum + 0.01 < payableTotal) {
          throw new BadRequestException(`Payments total (${paymentsSum}) does not cover order total (${payableTotal})`);
        }
        if (changeDue > 0.01 && cashPaid + 0.01 < changeDue) {
          throw new BadRequestException(`Change due (${changeDue}) exceeds cash received (${cashPaid})`);
        }

        const creditStoreAmount = normalizedPayments
          .filter((p) => p.method === 'credit_store')
          .reduce((sum, p) => sum + p.amount, 0);

        if (creditStoreAmount > 0) {
          if (!dto.customerId) {
            throw new BadRequestException('credit_store requires a customerId to validate creditLimit');
          }
          const customer = await tx.customer.findUnique({ where: { id: dto.customerId } });
          if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

          const creditLimit = Number(customer.creditLimit);
          const currentBalance = Number(customer.creditBalance);
          if (creditLimit > 0 && currentBalance + creditStoreAmount > creditLimit) {
            throw new BadRequestException(
              `Credit limit exceeded: limit ${creditLimit}, current balance ${currentBalance}, requested ${creditStoreAmount}`,
            );
          }
        }

        const orderId = uuidv4();

        const created = await tx.order.create({
          data: {
            id: orderId,
            localId: dto.localId,
            branchId: dto.branchId,
            terminalId: dto.terminalId,
            cashierId,
            customerId: dto.customerId,
            status: 'completed',
            isFreeEntry: dto.isFreeEntry ?? false,
            origin: dto.origin ?? 'counter',
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
              create: normalizedPayments.map((p, index) => ({
                id: uuidv4(),
                method: p.method,
                amount: p.amount,
                reference: p.reference,
                metadata: {
                  ...(index === 0 && tipAmount > 0
                    ? {
                        tipAmount,
                        ...(tipPercentage !== undefined ? { tipPercentage } : {}),
                      }
                    : {}),
                  ...(p.method === 'cash' && changeDue > 0 ? { changeDue } : {}),
                },
              })),
            },
          },
          include: { items: true, payments: true },
        });

        // Deduct stock (skipped for free entries)
        if (!dto.isFreeEntry) {
          for (const { item, variant } of itemsWithCost) {
            const prevQty = variant.stock;
            const newQty = prevQty - item.quantity;

            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: newQty } });
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
                balance: 0,
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

        return { order: created, changeDue };
      });
    });

    return { ...(order as unknown as OrderSummary), changeDue };
  }

  async listOrders(filters: OrderFilters, schemaName: string) {
    assertValidSchemaName(schemaName);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const where: Prisma.OrderWhereInput = { branchId: filters.branchId };

        if (filters.status) where.status = filters.status;
        if (filters.cashierId) where.cashierId = filters.cashierId;
        if (filters.origin) where.origin = filters.origin;
        if (filters.dateFrom || filters.dateTo) {
          where.createdAt = {};
          if (filters.dateFrom) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
          if (filters.dateTo) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(filters.dateTo);
        }
        if (filters.cursor) where.id = { gt: filters.cursor };

        const limit = filters.limit ?? 20;
        const orders = await tx.order.findMany({
          where,
          take: limit + 1,
          orderBy: { createdAt: 'desc' },
          include: { items: true, payments: true },
        });

        const hasMore = orders.length > limit;
        const data = hasMore ? orders.slice(0, limit) : orders;
        const customerIds = Array.from(
          new Set(
            data
              .map((order) => order.customerId)
              .filter((customerId): customerId is string => Boolean(customerId)),
          ),
        );

        const customers = customerIds.length > 0
          ? await tx.customer.findMany({
              where: { id: { in: customerIds } },
              select: { id: true, name: true, phone: true },
            })
          : [];

        const tableIds = Array.from(
          new Set(
            data
              .map((order) => (order as { tableId?: string | null }).tableId ?? null)
              .filter((tableId): tableId is string => Boolean(tableId)),
          ),
        );

        const tables = tableIds.length > 0
          ? await tx.$queryRawUnsafe<Array<{ id: string; number: number }>>(
              `SELECT id, number
               FROM "Table"
               WHERE id IN (${tableIds.map((_, index) => `$${index + 1}`).join(', ')})`,
              ...tableIds,
            )
          : [];

        const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
        const tableMap = new Map(tables.map((table) => [table.id, table]));

        return {
          data: data.map((order) => {
            const financials = extractOrderFinancials(order.payments);
            return {
              ...order,
              ...financials,
              customerName: order.customerId ? customerMap.get(order.customerId)?.name ?? null : null,
              customerPhone: order.customerId ? customerMap.get(order.customerId)?.phone ?? null : null,
              tableNumber: (() => {
                const tableId = (order as { tableId?: string | null }).tableId ?? null;
                return tableId ? tableMap.get(tableId)?.number ?? null : null;
              })(),
            };
          }),
          nextCursor: hasMore ? data[data.length - 1].id : null,
          hasMore,
        };
      });
    });
  }

  async getOrder(id: string, schemaName: string) {
    assertValidSchemaName(schemaName);
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: true, payments: true },
        });
        if (!order) throw new NotFoundException(`Order ${id} not found`);

        const customer = order.customerId
          ? await tx.customer.findUnique({
              where: { id: order.customerId },
              select: { id: true, name: true, phone: true, email: true },
            })
          : null;

        const orderTableId = (order as { tableId?: string | null }).tableId ?? null;

        const table = orderTableId
          ? (
              await tx.$queryRawUnsafe<Array<{ id: string; number: number; notes: string | null }>>(
                `SELECT id, number, notes
                 FROM "Table"
                 WHERE id = $1
                 LIMIT 1`,
                orderTableId,
              )
            )[0] ?? null
          : null;

        const variantIds = Array.from(new Set(order.items.map((item) => item.variantId)));
        const variants = variantIds.length > 0
          ? await tx.productVariant.findMany({
              where: { id: { in: variantIds } },
              select: {
                id: true,
                name: true,
                sku: true,
                productId: true,
              },
            })
          : [];

        const productIds = Array.from(new Set(variants.map((variant) => variant.productId)));
        const products = productIds.length > 0
          ? await tx.product.findMany({
              where: { id: { in: productIds } },
              select: { id: true, name: true },
            })
          : [];

        const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
        const productMap = new Map(products.map((product) => [product.id, product]));

        const financials = extractOrderFinancials(order.payments);

        return {
          ...order,
          ...financials,
          customer,
          customerName: customer?.name ?? null,
          table,
          tableNumber: table?.number ?? null,
          items: order.items.map((item) => {
            const variant = variantMap.get(item.variantId);
            const product = variant ? productMap.get(variant.productId) : null;
            return {
              ...item,
              variantName: variant?.name ?? 'Variante',
              sku: variant?.sku ?? null,
              productId: variant?.productId ?? null,
              productName: product?.name ?? 'Producto',
            };
          }),
        };
      });
    });
  }

  async holdOrder(id: string, schemaName: string): Promise<{ id: string; status: string }> {
    assertValidSchemaName(schemaName);
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const order = await tx.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException(`Order ${id} not found`);
        if (!['pending', 'completed'].includes(order.status)) {
          throw new BadRequestException(`Order status '${order.status}' cannot be put on hold`);
        }
        return tx.order.update({ where: { id }, data: { status: 'hold' }, select: { id: true, status: true } });
      });
    });
  }

  async resumeOrder(id: string, schemaName: string): Promise<{ id: string; status: string }> {
    assertValidSchemaName(schemaName);
    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const order = await tx.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException(`Order ${id} not found`);
        if (order.status !== 'hold') {
          throw new BadRequestException(`Order status is '${order.status}', not 'hold'`);
        }
        return tx.order.update({ where: { id }, data: { status: 'pending' }, select: { id: true, status: true } });
      });
    });
  }

  async refundOrder(orderId: string, dto: RefundOrderDto, cashierId: string, schemaName: string) {
    assertValidSchemaName(schemaName);

    return this.prisma.$transaction(async (tx) => {
      return withSchema(tx, schemaName, async () => {
        const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
        if (!order) throw new NotFoundException(`Order ${orderId} not found`);
        if (order.status === 'cancelled') throw new BadRequestException('Cannot refund a cancelled order');

        let refundTotal = 0;

        for (const refundItem of dto.items) {
          const orderItem = order.items.find((i) => i.id === refundItem.orderItemId);
          if (!orderItem) throw new BadRequestException(`OrderItem ${refundItem.orderItemId} not in order`);
          if (refundItem.quantity > orderItem.quantity) {
            throw new BadRequestException(`Refund qty ${refundItem.quantity} exceeds sold qty ${orderItem.quantity}`);
          }

          const variant = await tx.productVariant.findUnique({ where: { id: orderItem.variantId } });
          if (!variant) throw new NotFoundException(`Variant ${orderItem.variantId} not found`);

          const prevQty = variant.stock;
          const newQty = prevQty + refundItem.quantity;

          await tx.productVariant.update({ where: { id: orderItem.variantId }, data: { stock: newQty } });
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

          refundTotal +=
            (Number(orderItem.unitPrice) * refundItem.quantity) -
            (Number(orderItem.discount) * (refundItem.quantity / orderItem.quantity));
        }

        await tx.payment.create({
          data: {
            id: uuidv4(),
            orderId,
            method: dto.refundMethod,
            amount: -refundTotal,
            reference: `REFUND-${orderId.slice(0, 8)}`,
          },
        });

        const isFullRefund =
          dto.items.every((ri) => {
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
    });
  }

  getStatus() {
    return { module: 'pos', status: 'active' };
  }
}

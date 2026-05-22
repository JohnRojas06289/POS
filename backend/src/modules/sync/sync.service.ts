import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { SyncPushDto, SyncOperationDto } from './dto/sync-push.dto';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

export interface SyncResult {
  localId: string;
  status: 'done' | 'skipped' | 'conflict' | 'error';
  serverId?: string;
  conflictReason?: string;
  errorMessage?: string;
}

export interface SyncPushResponse {
  processed: number;
  succeeded: number;
  conflicts: number;
  errors: number;
  results: SyncResult[];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async pushOperations(dto: SyncPushDto, userId: string): Promise<SyncPushResponse> {
    // Sort by clientTimestamp ASC — chronological order
    const sorted = [...dto.operations].sort(
      (a, b) => new Date(a.clientTimestamp).getTime() - new Date(b.clientTimestamp).getTime(),
    );

    const results: SyncResult[] = [];
    let succeeded = 0;
    let conflicts = 0;
    let errors = 0;

    for (const op of sorted) {
      const result = await this.processOperation(op, dto.terminalId, userId);
      results.push(result);
      if (result.status === 'done' || result.status === 'skipped') succeeded++;
      else if (result.status === 'conflict') conflicts++;
      else errors++;
    }

    return {
      processed: sorted.length,
      succeeded,
      conflicts,
      errors,
      results,
    };
  }

  private async processOperation(
    op: SyncOperationDto,
    terminalId: string,
    userId: string,
  ): Promise<SyncResult> {
    try {
      // Idempotency check: if localId already processed successfully, skip
      const existing = await this.prisma.syncQueue.findFirst({
        where: { localId: op.localId, status: 'done' },
      });

      if (existing) {
        return {
          localId: op.localId,
          status: 'skipped',
          serverId: (existing as unknown as { serverId?: string }).serverId,
        };
      }

      // Upsert sync_queue entry
      const queueEntry = await this.prisma.syncQueue.upsert({
        where: { id: op.localId },
        update: { status: 'pending' },
        create: {
          id: op.localId,
          localId: op.localId,
          entityType: op.entityType,
          payload: op.payload as Prisma.InputJsonValue,
          clientTimestamp: new Date(op.clientTimestamp),
          status: 'pending',
        },
      });

      let serverId: string | undefined;
      let conflictReason: string | undefined;

      switch (op.entityType) {
        case 'order':
          ({ serverId, conflictReason } = await this.processOrder(op, userId));
          break;
        case 'stock_movement':
          ({ serverId, conflictReason } = await this.processStockMovement(op, userId));
          break;
        case 'customer':
          ({ serverId, conflictReason } = await this.processCustomer(op));
          break;
        case 'expense':
          ({ serverId, conflictReason } = await this.processExpense(op, userId));
          break;
        default:
          serverId = uuidv4();
      }

      const status = conflictReason ? 'conflict' : 'done';

      await this.prisma.syncQueue.update({
        where: { id: queueEntry.id },
        data: {
          status,
          conflictResolution: conflictReason ?? null,
          processedAt: new Date(),
        },
      });

      return {
        localId: op.localId,
        status,
        serverId,
        conflictReason,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sync error for ${op.localId}: ${message}`);

      await this.prisma.syncQueue.upsert({
        where: { id: op.localId },
        update: { status: 'error', conflictResolution: message },
        create: {
          id: op.localId,
          localId: op.localId,
          entityType: op.entityType,
          payload: op.payload as Prisma.InputJsonValue,
          clientTimestamp: new Date(op.clientTimestamp),
          status: 'error',
          conflictResolution: message,
        },
      });

      return { localId: op.localId, status: 'error', errorMessage: message };
    }
  }

  private async processOrder(
    op: SyncOperationDto,
    userId: string,
  ): Promise<{ serverId?: string; conflictReason?: string }> {
    if (op.operation !== 'CREATE') {
      return { serverId: op.entityId };
    }

    const payload = op.payload as {
      branchId: string;
      items?: Array<{ variantId: string; quantity: number; unitPrice: number }>;
      payments?: Array<{ method: string; amount: number }>;
      customerId?: string;
      terminalId?: string;
      notes?: string;
      tipAmount?: number;
      tipPercentage?: number;
    };

    const items = payload.items ?? [];
    const payments = payload.payments ?? [];
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountTotal = 0;
    const taxTotal = 0;
    const total = subtotal - discountTotal + taxTotal;
    const tipAmount = Number(payload.tipAmount ?? 0);
    const tipPercentage = payload.tipPercentage !== undefined ? Number(payload.tipPercentage) : undefined;
    const payableTotal = total + tipAmount;
    const paymentsSum = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const cashPaid = payments
      .filter((payment) => payment.method === 'cash')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const changeDue = Math.max(0, parseFloat((paymentsSum - payableTotal).toFixed(2)));

    if (paymentsSum + 0.01 < payableTotal) {
      return {
        conflictReason: JSON.stringify({
          reason: 'insufficient_payment',
          expected: payableTotal,
          received: paymentsSum,
        }),
      };
    }

    if (changeDue > 0.01 && cashPaid + 0.01 < changeDue) {
      return {
        conflictReason: JSON.stringify({
          reason: 'invalid_change_due',
          changeDue,
          cashPaid,
        }),
      };
    }

    // Verify stock availability
    if (items.length > 0) {
      for (const item of items) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (variant && variant.stock < item.quantity) {
          return {
            conflictReason: JSON.stringify({
              reason: 'insufficient_stock',
              variantId: item.variantId,
              available: variant.stock,
              requested: item.quantity,
            }),
          };
        }
      }
    }

    // Create the order
    const orderId = uuidv4();
    await this.prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: orderId,
          localId: op.localId,
          branchId: payload.branchId,
          terminalId: payload.terminalId,
          cashierId: userId,
            customerId: payload.customerId,
            status: 'completed',
            subtotal,
            discountTotal,
            taxTotal,
            total,
            notes: payload.notes,
            clientTimestamp: new Date(op.clientTimestamp),
            syncedAt: new Date(),
            items: {
              create: items.map((item) => ({
                id: uuidv4(),
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitCost: 0,
                discount: 0,
                taxRate: 0,
                total: item.unitPrice * item.quantity,
              })),
            },
            payments: {
              create: payments.map((p, index) => ({
                id: uuidv4(),
                method: p.method,
                amount: p.amount,
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
      });

      // Deduct stock
      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) continue;
        const newQty = variant.stock - item.quantity;
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
            previousQty: variant.stock,
            newQty,
            referenceId: orderId,
            referenceType: 'order',
            createdBy: userId,
          },
        });
      }
    });

    return { serverId: orderId };
  }

  private async processStockMovement(
    op: SyncOperationDto,
    userId: string,
  ): Promise<{ serverId?: string; conflictReason?: string }> {
    const payload = op.payload as {
      variantId: string;
      quantity: number;
      type: string;
    };

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: payload.variantId },
    });

    if (!variant) return { conflictReason: 'variant_not_found' };

    const newQty = variant.stock + payload.quantity;
    if (newQty < 0) {
      return {
        conflictReason: JSON.stringify({
          reason: 'insufficient_stock',
          available: variant.stock,
          requested: Math.abs(payload.quantity),
        }),
      };
    }

    const movementId = uuidv4();
    await this.prisma.$transaction(async (tx) => {
      await tx.productVariant.update({
        where: { id: payload.variantId },
        data: { stock: newQty },
      });
      await tx.stockMovement.create({
        data: {
          id: movementId,
          variantId: payload.variantId,
          type: payload.type ?? 'adjustment',
          quantity: payload.quantity,
          previousQty: variant.stock,
          newQty,
          referenceType: 'sync',
          createdBy: userId,
        },
      });
    });

    return { serverId: movementId };
  }

  private async processCustomer(
    op: SyncOperationDto,
  ): Promise<{ serverId?: string; conflictReason?: string }> {
    const payload = op.payload as { name: string; phone?: string; documentId?: string };

    if (op.operation === 'CREATE') {
      const customer = await this.prisma.customer.create({
        data: {
          id: uuidv4(),
          name: payload.name,
          phone: payload.phone,
          creditLimit: 0,
          creditBalance: 0,
        },
      });
      return { serverId: customer.id };
    }

    if (op.operation === 'UPDATE' && op.entityId) {
      // last-write-wins by clientTimestamp — just update
      await this.prisma.customer.update({
        where: { id: op.entityId },
        data: payload as Prisma.CustomerUpdateInput,
      });
      return { serverId: op.entityId };
    }

    return { serverId: op.entityId };
  }

  private async processExpense(
    op: SyncOperationDto,
    userId: string,
  ): Promise<{ serverId?: string; conflictReason?: string }> {
    const payload = op.payload as {
      branchId: string;
      category: string;
      amount: number;
      description?: string;
    };

    const expense = await this.prisma.expense.create({
      data: {
        id: uuidv4(),
        branchId: payload.branchId,
        category: payload.category,
        amount: payload.amount,
        description: payload.description,
        createdBy: userId,
      },
    });

    return { serverId: expense.id };
  }

  async pullUpdates(dto: { lastSyncAt: string; branchId: string }) {
    const since = new Date(dto.lastSyncAt);

    const [products, customers, configs] = await Promise.all([
      this.prisma.product.findMany({
        where: { updatedAt: { gte: since }, isActive: true },
        include: { variants: true },
      }),
      this.prisma.customer.findMany({
        where: { updatedAt: { gte: since }, isActive: true },
      }),
      this.prisma.tenantConfig.findMany({
        where: { updatedAt: { gte: since } },
      }),
    ]);

    const config = configs.reduce(
      (acc, c) => ({ ...acc, [c.key]: c.value }),
      {} as Record<string, unknown>,
    );

    return {
      products,
      customers,
      config,
      syncedAt: new Date().toISOString(),
    };
  }

  async getQueue(filters: { status?: string; entityType?: string }) {
    const where: Prisma.SyncQueueWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.entityType) where.entityType = filters.entityType;

    return this.prisma.syncQueue.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async resolveConflict(
    id: string,
    resolution: string,
    mergedPayload?: Record<string, unknown>,
  ) {
    return this.prisma.syncQueue.update({
      where: { id },
      data: {
        status: 'done',
        conflictResolution: JSON.stringify({ resolution, mergedPayload }),
        processedAt: new Date(),
      },
    });
  }
}

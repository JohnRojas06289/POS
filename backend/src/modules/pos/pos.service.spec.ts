import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockVariant = {
  id: 'var-1',
  sku: 'SKU001',
  stock: 10,
  unitCost: 5000,
  unitPrice: 9900,
  isActive: true,
};

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  productVariant: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  stockMovement: { create: jest.fn() },
  payment: { create: jest.fn() },
  creditTransaction: { create: jest.fn() },
  customer: { update: jest.fn() },
  $transaction: jest.fn(),
  $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
};

describe('PosService', () => {
  let service: PosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('returns existing order for duplicate offline localId (idempotent)', async () => {
      const existingOrder = { id: 'existing-order', items: [], payments: [] };
      mockPrisma.order.findUnique.mockResolvedValue(existingOrder);

      const result = await service.createOrder(
        {
          localId: 'some-local-id',
          branchId: 'branch-1',
          items: [{ variantId: 'var-1', quantity: 1, unitPrice: 9900 }],
          payments: [{ method: 'cash', amount: 9900 }],
        },
        'cashier-1',
        'tenant_test',
      );

      expect(result.id).toBe('existing-order');
    });

    it('throws BadRequestException when payments do not match total', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      mockPrisma.productVariant.findMany.mockResolvedValue([mockVariant]);

      await expect(
        service.createOrder(
          {
            branchId: 'branch-1',
            items: [{ variantId: 'var-1', quantity: 1, unitPrice: 9900 }],
            payments: [{ method: 'cash', amount: 5000 }], // wrong total
          },
          'cashier-1',
          'tenant_test',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates order with multiple payment methods (cash + nequi)', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      mockPrisma.productVariant.findMany.mockResolvedValue([mockVariant]);

      const createdOrder = {
        id: 'order-1',
        status: 'completed',
        total: 9900,
        items: [{ variantId: 'var-1', quantity: 1 }],
        payments: [
          { method: 'cash', amount: 5000 },
          { method: 'nequi', amount: 4900 },
        ],
      };

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<typeof createdOrder>) => fn(mockPrisma));
      mockPrisma.order.create.mockResolvedValue(createdOrder);
      mockPrisma.productVariant.update.mockResolvedValue({ ...mockVariant, stock: 9 });
      mockPrisma.stockMovement.create.mockResolvedValue({});

      const result = await service.createOrder(
        {
          branchId: 'branch-1',
          items: [{ variantId: 'var-1', quantity: 1, unitPrice: 9900 }],
          payments: [
            { method: 'cash', amount: 5000 },
            { method: 'nequi', amount: 4900 },
          ],
        },
        'cashier-1',
        'tenant_test',
      );

      expect(result.status).toBe('completed');
      expect(result.payments).toHaveLength(2);
    });

    it('throws BadRequestException when stock is insufficient', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      mockPrisma.productVariant.findMany.mockResolvedValue([{ ...mockVariant, stock: 0 }]);

      await expect(
        service.createOrder(
          {
            branchId: 'branch-1',
            items: [{ variantId: 'var-1', quantity: 5, unitPrice: 9900 }],
            payments: [{ method: 'cash', amount: 49500 }],
          },
          'cashier-1',
          'tenant_test',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('processes hold and resume correctly', async () => {
      mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 'order-1', status: 'completed' });
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'hold' });

      const held = await service.holdOrder('order-1', 'tenant_test');
      expect(held.status).toBe('hold');

      mockPrisma.order.findUnique.mockResolvedValueOnce({ id: 'order-1', status: 'hold' });
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'pending' });

      const resumed = await service.resumeOrder('order-1', 'tenant_test');
      expect(resumed.status).toBe('pending');
    });

    it('performs partial refund and creates stock_movement', async () => {
      const orderItemId = 'item-1';
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'completed',
        items: [{ id: orderItemId, variantId: 'var-1', quantity: 3, unitPrice: 9900, discount: 0 }],
      });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma));
      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      mockPrisma.productVariant.update.mockResolvedValue({ ...mockVariant, stock: 11 });
      mockPrisma.stockMovement.create.mockResolvedValue({});
      mockPrisma.payment.create.mockResolvedValue({});
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'completed', items: [], payments: [] });

      const result = await service.refundOrder(
        'order-1',
        { items: [{ orderItemId, quantity: 1 }], refundMethod: 'cash' },
        'cashier-1',
        'tenant_test',
      );

      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'refund' }) }),
      );
      expect(result.refundTotal).toBeGreaterThan(0);
    });
  });
});

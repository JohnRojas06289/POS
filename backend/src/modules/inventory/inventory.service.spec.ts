import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const makeMockPrisma = () => ({
  product: { create: jest.fn(), findMany: jest.fn() },
  productVariant: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  stockEntry: { create: jest.fn() },
  stockMovement: { create: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn(),
});

describe('InventoryService', () => {
  let service: InventoryService;
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  describe('CPP calculation (receiveStock)', () => {
    it('calculates CPP correctly after first reception (stock=0)', async () => {
      const variant = { id: 'var-1', sku: 'SKU001', stock: 0, unitCost: 0, isActive: true };
      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);

      const capturedRef: { current: { data: { unitCost: number; stock: number } } | null } = { current: null };
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        mockPrisma.productVariant.update.mockImplementation((args: { data: { unitCost: number; stock: number } }) => {
          capturedRef.current = args;
          return { ...variant, ...args.data };
        });
        mockPrisma.stockEntry.create.mockResolvedValue({});
        mockPrisma.stockMovement.create.mockResolvedValue({});
        return fn(mockPrisma);
      });

      await service.receiveStock(
        { variantId: 'var-1', branchId: 'b1', quantity: 10, unitCost: 5000 },
        'user-1',
      );

      expect(capturedRef.current?.data.unitCost).toBeCloseTo(5000);
      expect(capturedRef.current?.data.stock).toBe(10);
    });

    it('CPP se pondera correctamente tras 3 recepciones', async () => {
      // Recepción 1: 10 unidades a 5000 → CPP = 5000
      // Recepción 2: 20 unidades a 8000 → CPP = (10*5000 + 20*8000) / 30 = 7000
      // Recepción 3: 30 unidades a 6000 → CPP = (30*7000 + 30*6000) / 60 = 6500
      const states = [
        { stock: 0, unitCost: 0, qty: 10, cost: 5000, expectedCPP: 5000, expectedStock: 10 },
        { stock: 10, unitCost: 5000, qty: 20, cost: 8000, expectedCPP: 7000, expectedStock: 30 },
        { stock: 30, unitCost: 7000, qty: 30, cost: 6000, expectedCPP: 6500, expectedStock: 60 },
      ];

      for (const state of states) {
        const variant = { id: 'var-1', sku: 'SKU001', stock: state.stock, unitCost: state.unitCost, isActive: true };
        mockPrisma.productVariant.findUnique.mockResolvedValue(variant);

        const capturedRef: { current: { data: { unitCost: number; stock: number } } | null } = { current: null };
        mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
          mockPrisma.productVariant.update.mockImplementation((args: { data: { unitCost: number; stock: number } }) => {
            capturedRef.current = args;
            return { ...variant, ...args.data };
          });
          mockPrisma.stockEntry.create.mockResolvedValue({});
          mockPrisma.stockMovement.create.mockResolvedValue({});
          return fn(mockPrisma);
        });

        await service.receiveStock(
          { variantId: 'var-1', branchId: 'b1', quantity: state.qty, unitCost: state.cost },
          'user-1',
        );

        expect(capturedRef.current?.data.unitCost).toBeCloseTo(state.expectedCPP, 1);
        expect(capturedRef.current?.data.stock).toBe(state.expectedStock);
      }
    });

    it('previene stock negativo en adjustStock', async () => {
      const variant = { id: 'var-1', stock: 5, unitCost: 5000, isActive: true };
      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);

      await expect(
        service.adjustStock(
          { variantId: 'var-1', branchId: 'b1', quantity: -10, reasonCode: 'count_correction' },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('crea dos stock_movements en transferencia entre sucursales', async () => {
      const variant = { id: 'var-1', stock: 20, unitCost: 5000, isActive: true };
      mockPrisma.productVariant.findUnique.mockResolvedValue(variant);

      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<void>) => {
        mockPrisma.productVariant.update.mockResolvedValue({ ...variant, stock: 10 });
        mockPrisma.stockMovement.create.mockResolvedValue({});
        return fn(mockPrisma);
      });

      await service.transferStock(
        { variantId: 'var-1', fromBranchId: 'branch-a', toBranchId: 'branch-b', quantity: 10 },
        'user-1',
      );

      expect(mockPrisma.stockMovement.create).toHaveBeenCalledTimes(2);
      const calls = mockPrisma.stockMovement.create.mock.calls as Array<[{ data: { type: string } }]>;
      const types = calls.map(([args]) => args.data.type);
      expect(types).toContain('transfer_out');
      expect(types).toContain('transfer_in');
    });
  });
});

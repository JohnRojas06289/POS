import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const makeMockPrisma = () => ({
  customer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  creditTransaction: { create: jest.fn(), findMany: jest.fn() },
  order: { findMany: jest.fn(), groupBy: jest.fn() },
  $transaction: jest.fn(),
});

describe('CustomersService', () => {
  let service: CustomersService;
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<CustomersService>(CustomersService);
    jest.clearAllMocks();
  });

  describe('validateCreditPurchase', () => {
    it('rechaza cuando el monto supera el límite de crédito', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'c1',
        creditLimit: 50000,
        creditBalance: 30000,
      });

      await expect(
        service.validateCreditPurchase('c1', 25000), // 30000 + 25000 = 55000 > 50000
      ).rejects.toThrow(BadRequestException);
    });

    it('acepta cuando el monto no supera el límite', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'c1',
        creditLimit: 50000,
        creditBalance: 10000,
      });

      await expect(
        service.validateCreditPurchase('c1', 20000), // 10000 + 20000 = 30000 ≤ 50000
      ).resolves.toBeUndefined();
    });

    it('permite cualquier monto cuando creditLimit = 0 (sin límite)', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'c1',
        creditLimit: 0,
        creditBalance: 999999,
      });

      await expect(
        service.validateCreditPurchase('c1', 1000000),
      ).resolves.toBeUndefined();
    });
  });

  describe('payCredit', () => {
    it('lanza BadRequestException si el pago supera la deuda actual', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'c1', creditBalance: 10000,
      });

      await expect(
        service.payCredit('c1', { amount: 15000, paymentMethod: 'cash' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('actualiza el saldo correctamente en una transacción', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'c1', creditBalance: 50000,
      });

      const newBalance = 50000 - 30000;
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<{ transaction: unknown; newBalance: number; previousBalance: number }>) => {
        mockPrisma.customer.update.mockResolvedValue({ creditBalance: newBalance });
        mockPrisma.creditTransaction.create.mockResolvedValue({ id: 'tx-1' });
        return fn(mockPrisma);
      });

      const result = await service.payCredit('c1', { amount: 30000, paymentMethod: 'cash' });
      expect(result.newBalance).toBe(newBalance);
      expect(result.previousBalance).toBe(50000);
    });
  });

  describe('getCreditStatement', () => {
    it('calcula totales correctamente con cargos y pagos mezclados', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'c1', name: 'Test', creditLimit: 100000, creditBalance: 30000,
      });

      mockPrisma.creditTransaction.findMany.mockResolvedValue([
        { type: 'purchase', amount: 50000, createdAt: new Date('2026-01-01') },
        { type: 'payment', amount: 30000, createdAt: new Date('2026-01-15') },
        { type: 'purchase', amount: 10000, createdAt: new Date('2026-02-01') },
      ]);

      const statement = await service.getCreditStatement('c1');

      expect(statement.totalCharged).toBe(60000); // 50000 + 10000
      expect(statement.totalPaid).toBe(30000);
      expect(statement.currentDebt).toBe(30000);
      expect(statement.customer.availableCredit).toBe(70000); // 100000 - 30000
    });
  });
});

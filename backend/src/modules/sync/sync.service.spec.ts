import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../../database/prisma/prisma.service';

const makeMockPrisma = () => ({
  syncQueue: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  order: { create: jest.fn(), findUnique: jest.fn() },
  productVariant: { findUnique: jest.fn(), update: jest.fn() },
  stockMovement: { create: jest.fn() },
  customer: { create: jest.fn(), update: jest.fn() },
  expense: { create: jest.fn() },
  tenantConfig: { findMany: jest.fn() },
  product: { findMany: jest.fn() },
  $transaction: jest.fn(),
});

describe('SyncService', () => {
  let service: SyncService;
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<SyncService>(SyncService);
    jest.clearAllMocks();
  });

  describe('idempotency', () => {
    it('skips operation if localId already processed (status=done)', async () => {
      // First call: not processed
      mockPrisma.syncQueue.findFirst
        .mockResolvedValueOnce(null) // first call — not in queue
        .mockResolvedValueOnce({ id: 'op-1', status: 'done', serverId: 'server-1' }); // second call — already done

      mockPrisma.syncQueue.upsert.mockResolvedValue({ id: 'op-1' });
      mockPrisma.syncQueue.update.mockResolvedValue({});
      mockPrisma.expense.create.mockResolvedValue({ id: 'server-1' });

      const op = {
        localId: 'op-1',
        entityType: 'expense' as const,
        operation: 'CREATE' as const,
        payload: { branchId: 'b1', category: 'supplies', amount: 5000 },
        clientTimestamp: new Date().toISOString(),
      };

      // Process twice
      const result1 = await service.pushOperations(
        { terminalId: 'terminal-1', operations: [op] },
        'user-1',
      );

      // Simulate that second call finds it done
      mockPrisma.syncQueue.findFirst.mockResolvedValue({ id: 'op-1', status: 'done' });

      const result2 = await service.pushOperations(
        { terminalId: 'terminal-1', operations: [op] },
        'user-1',
      );

      expect(result1.succeeded).toBe(1);
      expect(result2.results[0].status).toBe('skipped');
      // expense.create called exactly once across both calls
      expect(mockPrisma.expense.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('conflict: insufficient stock', () => {
    it('marks order as conflict when stock is insufficient, continues processing', async () => {
      const ops = [
        {
          localId: 'op-1',
          entityType: 'expense' as const,
          operation: 'CREATE' as const,
          payload: { branchId: 'b1', category: 'cleaning', amount: 2000 },
          clientTimestamp: '2026-01-01T09:00:00.000Z',
        },
        {
          localId: 'op-2',
          entityType: 'order' as const,
          operation: 'CREATE' as const,
          payload: {
            branchId: 'b1',
            items: [{ variantId: 'var-1', quantity: 100, unitPrice: 5000 }],
            payments: [{ method: 'cash', amount: 500000 }],
          },
          clientTimestamp: '2026-01-01T09:01:00.000Z',
        },
        {
          localId: 'op-3',
          entityType: 'expense' as const,
          operation: 'CREATE' as const,
          payload: { branchId: 'b1', category: 'supplies', amount: 3000 },
          clientTimestamp: '2026-01-01T09:02:00.000Z',
        },
      ];

      mockPrisma.syncQueue.findFirst.mockResolvedValue(null);
      mockPrisma.syncQueue.upsert.mockResolvedValue({ id: 'any' });
      mockPrisma.syncQueue.update.mockResolvedValue({});
      mockPrisma.expense.create.mockResolvedValue({ id: 'expense-id' });

      // op-2: variant has only 5 units, order requests 100
      mockPrisma.productVariant.findUnique.mockResolvedValue({ id: 'var-1', stock: 5 });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma));

      const result = await service.pushOperations(
        { terminalId: 'terminal-1', operations: ops },
        'user-1',
      );

      expect(result.processed).toBe(3);
      expect(result.conflicts).toBe(1);
      expect(result.succeeded).toBe(2); // op-1 and op-3

      const op2Result = result.results.find((r) => r.localId === 'op-2');
      expect(op2Result?.status).toBe('conflict');
      expect(op2Result?.conflictReason).toContain('insufficient_stock');

      // op-3 still processed
      const op3Result = result.results.find((r) => r.localId === 'op-3');
      expect(op3Result?.status).toBe('done');
    });
  });

  describe('chronological order', () => {
    it('processes operations in clientTimestamp order regardless of array order', async () => {
      const processedOrder: string[] = [];

      mockPrisma.syncQueue.findFirst.mockResolvedValue(null);
      mockPrisma.syncQueue.upsert.mockResolvedValue({ id: 'any' });
      mockPrisma.syncQueue.update.mockResolvedValue({});
      mockPrisma.expense.create.mockImplementation(async (args: { data: { description?: string } }) => {
        processedOrder.push(args.data.description ?? '');
        return { id: uuidMock() };
      });

      const ops = [
        {
          localId: 'op-c',
          entityType: 'expense' as const,
          operation: 'CREATE' as const,
          payload: { branchId: 'b1', category: 'c', amount: 1, description: 'third' },
          clientTimestamp: '2026-01-01T09:02:00.000Z',
        },
        {
          localId: 'op-a',
          entityType: 'expense' as const,
          operation: 'CREATE' as const,
          payload: { branchId: 'b1', category: 'a', amount: 1, description: 'first' },
          clientTimestamp: '2026-01-01T09:00:00.000Z',
        },
        {
          localId: 'op-b',
          entityType: 'expense' as const,
          operation: 'CREATE' as const,
          payload: { branchId: 'b1', category: 'b', amount: 1, description: 'second' },
          clientTimestamp: '2026-01-01T09:01:00.000Z',
        },
      ];

      await service.pushOperations({ terminalId: 'terminal-1', operations: ops }, 'user-1');

      expect(processedOrder[0]).toBe('first');
      expect(processedOrder[1]).toBe('second');
      expect(processedOrder[2]).toBe('third');
    });
  });

  describe('payment validation', () => {
    it('marks order as conflict when payment does not cover total', async () => {
      mockPrisma.syncQueue.findFirst.mockResolvedValue(null);
      mockPrisma.syncQueue.upsert.mockResolvedValue({ id: 'any' });
      mockPrisma.syncQueue.update.mockResolvedValue({});
      mockPrisma.productVariant.findUnique.mockResolvedValue({ id: 'var-1', stock: 10 });

      const result = await service.pushOperations(
        {
          terminalId: 'terminal-1',
          operations: [
            {
              localId: 'op-pay-1',
              entityType: 'order' as const,
              operation: 'CREATE' as const,
              payload: {
                branchId: 'b1',
                items: [{ variantId: 'var-1', quantity: 1, unitPrice: 10000 }],
                payments: [{ method: 'cash', amount: 5000 }],
              },
              clientTimestamp: '2026-01-01T09:00:00.000Z',
            },
          ],
        },
        'user-1',
      );

      expect(result.conflicts).toBe(1);
      expect(result.results[0].status).toBe('conflict');
      expect(result.results[0].conflictReason).toContain('insufficient_payment');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});

let uuidCounter = 0;
function uuidMock(): string {
  return `mock-uuid-${++uuidCounter}`;
}

import { Test, TestingModule } from '@nestjs/testing';
import { CashService } from './cash.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

const makeMockPrisma = () => ({
  cashSession: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  payment: { findMany: jest.fn() },
  order: { findMany: jest.fn(), count: jest.fn() },
});

describe('CashService', () => {
  let service: CashService;
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<CashService>(CashService);
    jest.clearAllMocks();
  });

  it('lanza ConflictException si ya hay una sesión abierta en el terminal', async () => {
    mockPrisma.cashSession.findFirst.mockResolvedValue({ id: 'session-existing' });

    await expect(
      service.openSession(
        { terminalId: 'terminal-1', openingCash: 100000 },
        'cashier-1',
        'branch-1',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('abre sesión correctamente cuando no hay una activa', async () => {
    mockPrisma.cashSession.findFirst.mockResolvedValue(null);
    const created = { id: 'session-new', status: 'open', openingAmount: 100000 };
    mockPrisma.cashSession.create.mockResolvedValue(created);

    const result = await service.openSession(
      { terminalId: 'terminal-1', openingCash: 100000 },
      'cashier-1',
      'branch-1',
    );

    expect(result.status).toBe('open');
    expect(mockPrisma.cashSession.create).toHaveBeenCalledTimes(1);
  });

  it('calcula expected_cash correctamente al cerrar sesión', async () => {
    const openedAt = new Date('2026-01-01T08:00:00Z');
    const session = {
      id: 'session-1',
      status: 'open',
      branchId: 'branch-1',
      openingAmount: 100000,
      openedAt,
      closedAt: null,
    };
    mockPrisma.cashSession.findUnique.mockResolvedValue(session);

    // 2 ventas en efectivo: $50000 y $30000
    // 1 devolución en efectivo: -$10000
    mockPrisma.payment.findMany.mockResolvedValue([
      { amount: 50000 },
      { amount: 30000 },
      { amount: -10000 },
    ]);

    // expectedCash = 100000 + 50000 + 30000 - 10000 = 170000
    const expectedCash = 170000;
    const closingCash = 165000; // cajero cuenta $5000 menos
    const expectedDiff = closingCash - expectedCash; // -5000

    const updated = {
      ...session,
      status: 'closed',
      closingAmount: closingCash,
      expectedAmount: expectedCash,
      difference: expectedDiff,
      closedAt: new Date(),
    };
    mockPrisma.cashSession.update.mockResolvedValue(updated);

    const result = await service.closeSession('session-1', { closingCash });

    expect(result.expectedAmount).toBe(expectedCash);
    expect(result.difference).toBe(expectedDiff);
    expect(result.status).toBe('closed');
  });

  it('lanza BadRequestException si se intenta cerrar una sesión ya cerrada', async () => {
    mockPrisma.cashSession.findUnique.mockResolvedValue({
      id: 'session-1',
      status: 'closed',
    });

    await expect(
      service.closeSession('session-1', { closingCash: 100000 }),
    ).rejects.toThrow(BadRequestException);
  });
});

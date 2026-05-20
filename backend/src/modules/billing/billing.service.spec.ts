import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'wompi.apiUrl': 'https://sandbox.wompi.co/v1',
        'wompi.privateKey': 'test-key',
        'wompi.eventsSecret': '',
        'wompi.publicKey': 'pub-test-key',
        'app.url': 'http://localhost:3000',
      };
      return map[key];
    }),
  };

  const mockPrisma = {
    plan: { findUnique: jest.fn(), findMany: jest.fn() },
    subscription: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    tenant: { update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
  });

  describe('getPlans', () => {
    it('returns active plans ordered by price', async () => {
      mockPrisma.plan.findMany.mockResolvedValue([
        { id: 'p1', name: 'Starter', price: 99000 },
        { id: 'p2', name: 'Pro', price: 199000 },
      ]);
      const plans = await service.getPlans();
      expect(plans).toHaveLength(2);
      expect(mockPrisma.plan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('throws BadRequestException if plan not found', async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);
      await expect(
        service.createCheckoutSession('t1', 'bad-plan', 'a@b.co', 'Test'),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns checkout URL and reference', async () => {
      mockPrisma.plan.findUnique.mockResolvedValue({ id: 'p1', price: 99000 });
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
      const result = await service.createCheckoutSession('tenant-1', 'p1', 'a@b.co', 'Test');
      expect(result.checkoutUrl).toContain('checkout.wompi.co');
      expect(result.reference).toContain('nexus-');
    });
  });

  describe('handleWebhook', () => {
    it('activates subscription on APPROVED status', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: 'sub1', tenantId: 't1' });
      mockPrisma.subscription.update.mockResolvedValue({});
      mockPrisma.tenant.update.mockResolvedValue({});

      await service.handleWebhook(
        {
          event: 'transaction.updated',
          data: { transaction: { id: 'tx1', status: 'APPROVED', reference: 'nexus-t1-abc' } },
          signature: { properties: [] },
          timestamp: Date.now(),
        },
        '',
      );

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'active' }) }),
      );
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: true } }),
      );
    });

    it('cancels subscription on DECLINED status', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: 'sub1', tenantId: 't1' });
      mockPrisma.subscription.update.mockResolvedValue({});

      await service.handleWebhook(
        {
          event: 'transaction.updated',
          data: { transaction: { status: 'DECLINED', reference: 'nexus-t1-abc' } },
          signature: { properties: [] },
          timestamp: Date.now(),
        },
        '',
      );

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'cancelled' } }),
      );
    });

    it('ignores non-transaction events', async () => {
      await service.handleWebhook(
        { event: 'other.event', data: {}, signature: { properties: [] }, timestamp: 0 },
        '',
      );
      expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled();
    });
  });
});

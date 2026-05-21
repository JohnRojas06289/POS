import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('OnboardingService', () => {
  let service: OnboardingService;

  const mockPrisma = {
    tenant: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn(), deleteMany: jest.fn() },
    plan: { findUnique: jest.fn() },
    subscription: { create: jest.fn(), deleteMany: jest.fn() },
    $transaction: jest.fn(),
    $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
    $queryRawUnsafe: jest.fn(),
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<OnboardingService>(OnboardingService);
    jest.clearAllMocks();
  });

  describe('checkSchemaAvailability', () => {
    it('returns false for invalid characters', async () => {
      const res = await service.checkSchemaAvailability('My-Schema!');
      expect(res.available).toBe(false);
    });

    it('returns false for too short name', async () => {
      const res = await service.checkSchemaAvailability('ab');
      expect(res.available).toBe(false);
    });

    it('returns false when schema name is taken', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({ id: 'existing' });
      const res = await service.checkSchemaAvailability('arepas');
      expect(res.available).toBe(false);
    });

    it('returns true when schema name is available', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      const res = await service.checkSchemaAvailability('mynewbiz');
      expect(res.available).toBe(true);
    });
  });

  describe('registerTenant', () => {
    const dto = {
      businessName: 'Arepas El Mono',
      email: 'admin@mono.co',
      password: 'securepass123',
      phone: '3001234567',
      schemaName: 'arepas_mono',
      planId: 'plan-free',
      templateId: 'template-food',
    };

    it('throws ConflictException when email already registered', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({ email: dto.email, schemaName: 'other' });
      await expect(service.registerTenant(dto)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when schema already taken', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({ email: 'other@other.co', schemaName: dto.schemaName });
      await expect(service.registerTenant(dto)).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when plan not found', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.plan.findUnique.mockResolvedValue(null);
      await expect(service.registerTenant(dto)).rejects.toThrow(BadRequestException);
    });

    it('returns requiresPayment=false for free plans', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.plan.findUnique.mockResolvedValue({ id: 'plan-free', price: 0 });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<void>) => {
        await fn(mockPrisma);
      });
      const result = await service.registerTenant(dto);
      expect(result.requiresPayment).toBe(false);
      expect(result.schemaName).toBe('arepas_mono');
    });

    it('returns requiresPayment=true for paid plans', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.plan.findUnique.mockResolvedValue({ id: 'plan-pro', price: 199000 });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<void>) => {
        await fn(mockPrisma);
      });
      const result = await service.registerTenant(dto);
      expect(result.requiresPayment).toBe(true);
    });

    it('rolls back tenant records when provisioning fails', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.plan.findUnique.mockResolvedValue({ id: 'plan-free', price: 0 });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<void>) => {
        await fn(mockPrisma);
      });
      mockPrisma.$executeRawUnsafe.mockImplementation(() => Promise.reject(new Error('schema provisioning failed')));

      await expect(service.registerTenant(dto)).rejects.toThrow('schema provisioning failed');
      expect(mockPrisma.subscription.deleteMany).toHaveBeenCalledWith({ where: { tenantId: expect.any(String) } });
      expect(mockPrisma.tenant.deleteMany).toHaveBeenCalledWith({ where: { id: expect.any(String) } });
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('DROP SCHEMA IF EXISTS'));
    });
  });
});

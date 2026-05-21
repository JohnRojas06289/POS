import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../../database/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    tenant: {
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
    businessTemplate: { findUnique: jest.fn() },
    subscription: { create: jest.fn() },
    $transaction: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };

  const mockRedis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn(() => 'access-token'),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'app.url') return 'http://localhost:3000';
      if (key === 'email.from') return 'noreply@nexuspos.app';
      if (key === 'email.resendApiKey') return '';
      if (key === 'nodeEnv') return 'development';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('rolls back tenant registration when provisioning fails', async () => {
    mockPrisma.tenant.findFirst.mockResolvedValue(null);
    mockPrisma.tenant.create.mockResolvedValue({ id: 'tenant-1', businessType: 'retail_clothing' });
    mockPrisma.businessTemplate.findUnique.mockResolvedValue(null);
    mockPrisma.$executeRawUnsafe.mockImplementation(() => Promise.reject(new Error('schema failed')));

    await expect(
      service.registerTenant({
        tenantName: 'Mi Negocio',
        email: 'owner@negocio.co',
        password: 'password123',
        ownerName: 'Owner',
        country: 'CO',
        timezone: 'America/Bogota',
        currency: 'COP',
        businessType: 'retail_clothing',
      }),
    ).rejects.toThrow('schema failed');

    expect(mockPrisma.tenant.deleteMany).toHaveBeenCalledWith({ where: { id: 'tenant-1' } });
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(expect.stringContaining('DROP SCHEMA IF EXISTS'));
  });

  it('creates a local password reset link in development when email delivery is unavailable', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', isActive: true, schemaName: 'tenant_demo' });
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { id: 'user-1', email: 'owner@negocio.co', isActive: true },
    ]);

    const result = await service.requestPasswordReset({
      tenantEmail: 'business@negocio.co',
      email: 'owner@negocio.co',
    });

    expect(mockRedis.set).toHaveBeenCalled();
    expect(result.message).toBe('Enlace generado para desarrollo.');
    expect(result.resetLink).toContain('/reset-password?token=');
  });

  it('resets a password using the stored recovery token', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify({
        userId: 'user-1',
        email: 'owner@negocio.co',
        tenantId: 'tenant-1',
        schemaName: 'tenant_demo',
      }),
    );
    mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined);

    const result = await service.resetPassword({
      token: 'recovery-token',
      newPassword: 'new-password-123',
    });

    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "tenant_demo"."User"'),
      'user-1',
      expect.any(String),
    );
    expect(mockRedis.del).toHaveBeenCalledWith(expect.stringContaining('password-reset:'));
    expect(result.message).toBe('Contraseña actualizada correctamente.');
  });
});

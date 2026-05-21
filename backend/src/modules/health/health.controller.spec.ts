import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../../database/redis/redis.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrisma = {
    $queryRawUnsafe: jest.fn(),
  };

  const mockRedis = {
    ping: jest.fn(),
    isAvailable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    controller = module.get(HealthController);
    jest.clearAllMocks();
  });

  it('returns ok when database and redis are up', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValueOnce(true);
    mockRedis.isAvailable.mockReturnValue(true);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(result.redis).toBe('up');
  });

  it('returns degraded when redis is unavailable but database is up', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValueOnce(false);
    mockRedis.isAvailable.mockReturnValue(false);

    const result = await controller.check();

    expect(result.status).toBe('degraded');
    expect(result.database).toBe('up');
    expect(result.redis).toBe('fallback');
  });

  it('throws service unavailable when database is down', async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('db down'));
    mockRedis.ping.mockResolvedValueOnce(false);
    mockRedis.isAvailable.mockReturnValue(false);

    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

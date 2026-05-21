import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RedisService } from '../../database/redis/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(): Promise<{
    status: 'ok' | 'degraded' | 'down';
    database: 'up' | 'down';
    redis: 'up' | 'fallback' | 'down';
    timestamp: string;
  }> {
    const timestamp = new Date().toISOString();

    let database: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      database = 'down';
    }

    const redisUp = await this.redis.ping();
    const redis: 'up' | 'fallback' | 'down' = redisUp
      ? 'up'
      : this.redis.isAvailable()
        ? 'down'
        : 'fallback';

    if (database === 'down') {
      throw new ServiceUnavailableException({
        status: 'down',
        database,
        redis,
        timestamp,
      });
    }

    return {
      status: redis === 'up' ? 'ok' : 'degraded',
      database,
      redis,
      timestamp,
    };
  }
}

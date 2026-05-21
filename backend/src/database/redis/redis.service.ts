import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private redisAvailable = false;
  // In-memory fallback for when Redis is not available (dev mode)
  private memoryStore = new Map<string, { value: string; expiresAt: number | null }>();

  onModuleInit(): void {
    this.client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });

    this.client.on('connect', () => {
      this.redisAvailable = true;
      this.logger.log('Redis connected');
    });
    this.client.on('error', () => {
      if (this.redisAvailable) {
        this.logger.warn('Redis unavailable — falling back to in-memory store');
      }
      this.redisAvailable = false;
    });

    // Try to connect; if it fails, we'll use the memory store
    this.client.connect().catch(() => {
      this.logger.warn('Redis not reachable — using in-memory token store (dev mode)');
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisAvailable) {
      await this.client.quit();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isAvailable(): boolean {
    return this.redisAvailable;
  }

  async ping(): Promise<boolean> {
    if (!this.redisAvailable) return false;

    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      this.redisAvailable = false;
      return false;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.redisAvailable) {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } else {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
      this.memoryStore.set(key, { value, expiresAt });
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.redisAvailable) {
      return this.client.get(key);
    }
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    if (this.redisAvailable) {
      await this.client.del(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (this.redisAvailable) {
      const result = await this.client.exists(key);
      return result === 1;
    }
    const entry = this.memoryStore.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return false;
    }
    return true;
  }
}

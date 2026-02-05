import type { OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(
              'Redis connection failed after 3 retries, falling back to no-cache mode'
            );
            return null; // Stop retrying
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.error('Redis connection error', err.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });
    } else {
      this.logger.warn('REDIS_URL not configured, running without Redis');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      return await this.client!.get(key);
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Set a value in Redis with optional TTL (in seconds)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      if (ttlSeconds) {
        await this.client!.setex(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}`, error);
      return false;
    }
  }

  /**
   * Increment a counter with TTL (for rate limiting)
   * Returns the new count
   */
  async incrementWithTTL(key: string, ttlSeconds: number): Promise<number | null> {
    if (!this.isAvailable()) return null;
    try {
      const pipeline = this.client!.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, ttlSeconds);
      const results = await pipeline.exec();
      // results[0] is [error, value] for INCR
      return results?.[0]?.[1] as number;
    } catch (error) {
      this.logger.error(`Redis INCR error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Get the TTL (time to live) of a key in seconds
   */
  async ttl(key: string): Promise<number | null> {
    if (!this.isAvailable()) return null;
    try {
      return await this.client!.ttl(key);
    } catch (error) {
      this.logger.error(`Redis TTL error for key ${key}`, error);
      return null;
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Redis DEL error for key ${key}`, error);
      return false;
    }
  }

  /**
   * Get JSON value
   */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set JSON value with optional TTL
   */
  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      return await this.set(key, JSON.stringify(value), ttlSeconds);
    } catch {
      return false;
    }
  }
}

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Plain ioredis read-through cache in front of the real Printify API — this
 * is Redis's CACHE role (GET/SET EX, no retries/backoff/job semantics),
 * kept deliberately separate from BullMQ's QUEUE role on the same Redis
 * instance. TTL is read from env rather than hardcoded since cache-lifetime
 * tuning is an open decision for this project.
 */
@Injectable()
export class PrintifyCacheService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly ttlSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.get<string>('REDIS_URL')!);
    this.ttlSeconds = Number(
      this.config.get<string>('PRINTIFY_CACHE_TTL_SECONDS'),
    );
  }

  private productKey(productId: string): string {
    return `printify:product:${productId}`;
  }

  async getProduct(productId: string): Promise<string | null> {
    return this.client.get(this.productKey(productId));
  }

  async setProduct(productId: string, rawJson: string): Promise<void> {
    // SET key value EX ttlSeconds - 'EX' is the way of ioredis prop TTL
    await this.client.set(
      this.productKey(productId),
      rawJson,
      'EX',
      this.ttlSeconds,
    );
  }

  private catalogKey(page: number): string {
    return `printify:catalog:page:${page}`;
  }

  async getCatalogPage(page: number): Promise<string | null> {
    return this.client.get(this.catalogKey(page));
  }

  async setCatalogPage(page: number, rawJson: string): Promise<void> {
    await this.client.set(
      this.catalogKey(page),
      rawJson,
      'EX',
      this.ttlSeconds,
    );
  }

  // NestJS auto call this hook when module have been destroyed (app shutdown) - close Redis connection to clean, avoid leak
  onModuleDestroy() {
    this.client.disconnect();
  }
}

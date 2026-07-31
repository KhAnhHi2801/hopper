import { Module } from '@nestjs/common';
import { PrintifyCacheService } from './printify-cache.service';

/**
 * Isolates Redis's CACHE role (plain GET/SET, no job semantics) into its own
 * module — deliberately separate from BullModule/`@nestjs/bullmq`, which owns
 * Redis's QUEUE role. Never mix the two: this module must not import BullModule,
 * and no `@Processor` class should hold a raw ioredis client directly.
 */
@Module({
  providers: [PrintifyCacheService],
  exports: [PrintifyCacheService],
})
export class PrintifyCacheModule {}

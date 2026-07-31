import { Module } from '@nestjs/common';
import { PrintifyApiModule } from './printify-api.module';
import { PrintifyCacheModule } from './printify-cache.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RawProduct,
  RawProductSchema,
} from '../raw-products/raw-product.schema';
import { BullModule } from '@nestjs/bullmq';
import { PrintifyNormalizerService } from './printify-normalizer.service';
import { PrintifyImportProcessor } from './printify-import.processor';
import { PrintifyCatalogProcessor } from './printify-catalog.processor';

/**
 * Wires together the Printify domain: imports the API/cache sub-modules,
 * registers the `raw_products` Mongoose schema, registers every BullMQ queue
 * this domain either consumes or produces on, and provides the normalizer +
 * both `@Processor` workers. This is the only module Nest needs to bootstrap
 * to make the printify-import/printify-catalog pipelines live.
 */
@Module({
  imports: [
    PrintifyApiModule,
    PrintifyCacheModule,
    MongooseModule.forFeature([
      { name: RawProduct.name, schema: RawProductSchema },
    ]),
    BullModule.registerQueue(
      { name: 'printify-import' }, //consume (worker)
      { name: 'printify-catalog' },
      { name: 'shopify-import' }, //produce
      { name: 'job-events' }, // produce
    ),
  ],
  providers: [
    PrintifyNormalizerService,
    PrintifyImportProcessor,
    PrintifyCatalogProcessor,
  ],
})
export class PrintifyModule {}

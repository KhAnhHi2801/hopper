import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PrintifyApiService } from '../printify-api/printify-api.service';
import { PrintifyCacheService } from '../printify-cache/printify-cache.service';
import { PrintifyNormalizerService } from './printify-normalizer.service';
import { Job } from 'bullmq';
import { CreateProductDto } from '@hopper/product-contract';

interface PrintifyCatalogJobData {
  apiKey: string;
  shopId: string;
  page: number;
}

/**
 * BullMQ consumer for the `printify-catalog` queue — the sync-over-async
 * (request/reply) pattern. Unlike {@link PrintifyImportProcessor}, this
 * `process()` `return`s a real value instead of `void`; that return value is
 * exactly what a caller's `job.waitUntilFinished(queueEvents)` receives
 * (planned caller: orchestration-service in Phase 4), avoiding the need for a
 * separate reply queue.
 */
@Processor('printify-catalog')
export class PrintifyCatalogProcessor extends WorkerHost {
  constructor(
    private readonly api: PrintifyApiService,
    private readonly cache: PrintifyCacheService,
    private readonly nomalizer: PrintifyNormalizerService,
  ) {
    super();
  }

  async process(job: Job<PrintifyCatalogJobData>): Promise<CreateProductDto[]> {
    const { apiKey, shopId, page } = job.data;

    // Cache-first (CACHE role, not queue) — one cached JSON blob per page.
    let rawJson = await this.cache.getCatalogPage(page);
    let rawList: Record<string, unknown>[];

    if (rawJson) {
      rawList = JSON.parse(rawJson) as Record<string, unknown>[];
    } else {
      const rawResponse = await this.api.listProducts(apiKey, shopId, page);
      // Printify's list endpoint wraps the array in `{ data: [...] }` —
      // extract `.data`, don't cast the whole response as the array itself.
      rawList = (rawResponse as { data: Record<string, unknown>[] }).data;
      rawJson = JSON.stringify(rawList);
      await this.cache.setCatalogPage(page, rawJson);
    }

    const products = await Promise.all(
      rawList.map((raw) => this.nomalizer.normalize(raw, shopId)),
    );

    return products;
  }
}

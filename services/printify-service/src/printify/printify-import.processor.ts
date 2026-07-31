import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { PrintifyApiService } from './printify-api.service';
import { PrintifyCacheService } from './printify-cache.service';
import { PrintifyNormalizerService } from './printify-normalizer.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  RawProduct,
  RawProductDocument,
} from '../raw-products/raw-product.schema';
import { Job, Queue } from 'bullmq';
import { Model } from 'mongoose';

interface PrintifyImportJobData {
  apiKey: string;
  shopId: string;
  productId: string;
}

/**
 * BullMQ consumer (Worker) for the `printify-import` queue. Nest invokes
 * `process()` automatically whenever a job lands on this queue — nothing in
 * this codebase calls it directly. Fire-and-forget: on success it produces
 * follow-up jobs onto `shopify-import` and `job-events` rather than returning
 * a value (contrast with {@link PrintifyCatalogProcessor}, which uses the
 * sync-over-async return-value pattern instead).
 */
@Processor('printify-import')
export class PrintifyImportProcessor extends WorkerHost {
  constructor(
    private readonly api: PrintifyApiService,
    private readonly cache: PrintifyCacheService,
    private readonly nomalizer: PrintifyNormalizerService,

    @InjectModel(RawProduct.name)
    private readonly rawProductModel: Model<RawProductDocument>,

    @InjectQueue('shopify-import')
    private readonly shopifyImportQueue: Queue,

    @InjectQueue('job-events')
    private readonly jobEventsQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<PrintifyImportJobData>): Promise<void> {
    const { apiKey, shopId, productId } = job.data;

    // Step 1: Check cache (read role CACHE, not queue)
    let rawJson = await this.cache.getProduct(productId);
    let raw: Record<string, unknown>;

    if (rawJson) {
      raw = JSON.parse(rawJson) as Record<string, unknown>;
    } else {
      raw = (await this.api.getProduct(apiKey, shopId, productId)) as Record<
        string,
        unknown
      >;
      rawJson = JSON.stringify(raw);
      await this.cache.setProduct(productId, rawJson);
    }

    // Step 3: save raw doc into MongoDB
    await this.rawProductModel.create({
      platform: 'printify',
      sourceProductId: productId,
      raw,
    });

    // Step 4: nomalizer raw -> CreateProductDto
    const productDto = await this.nomalizer.normalize(raw, shopId);

    // Step 5: PRODUCE 2 new jobs = push next job to another queue
    // .add(job-name, data) - job's name just only to log/debug, data is real payload
    await this.shopifyImportQueue.add('import-product', {
      shopId,
      product: productDto,
    });

    await this.jobEventsQueue.add('status-update', {
      productId,
      status: 'NORMALIZED',
    });
  }
}

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

const PRINTIFY_BASE_URL = 'https://api.printify.com';
const PRINTIFY_VERSION = 'v1';
const PRINTIFY_URL = `${PRINTIFY_BASE_URL}/${PRINTIFY_VERSION}`;

/**
 * Thin HTTP client for the real Printify REST API. Deliberately stateless —
 * `apiKey` is passed in per-call rather than stored on the instance, since
 * credentials belong to orchestration-service (Phase 4) and only ever live
 * for the duration of one BullMQ job's processing.
 */
@Injectable()
export class PrintifyApiService {
  constructor(private readonly http: HttpService) {}

  /** Fetch one product's raw JSON from Printify. Caller is responsible for
   * caching — this method always hits the network. */
  async getProduct(
    apiKey: string,
    shopId: string,
    productId: string,
  ): Promise<unknown> {
    // this.http.get(...) returns an Observable<AxiosResponse<T>>.
    // firstValueFrom takes the first value and converts it into a Promise, similar to waiting for a standard fetch operation.
    const response = await firstValueFrom(
      this.http.get(
        `${PRINTIFY_URL}/shops/${shopId}/products/${productId}.json`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      ),
    );

    return response.data;
  }

  /** Fetch one page of a shop's product catalog from Printify (paginated
   * list endpoint), always over the network — caller handles caching. */
  async listProducts(
    apiKey: string,
    shopId: string,
    page: number,
  ): Promise<unknown> {
    const response = await firstValueFrom(
      this.http.get(`${PRINTIFY_URL}/shops/${shopId}/products.json`, {
        params: { page },
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    );

    return response.data;
  }
}

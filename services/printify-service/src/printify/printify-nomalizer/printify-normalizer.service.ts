import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateProductDto,
  ProductImageDto,
  ProductVariantDto,
  E_SOURCE_PLATFORM,
  E_PRODUCT_STATUS,
} from '@hopper/product-contract';
import { IPrintifyRawProduct } from '../utils/printify-raw-product.interface';

/**
 * Converts raw Printify API JSON into the shared `CreateProductDto` contract
 * (see `@hopper/product-contract`), validating the result before returning it.
 * This is the core unit-tested business logic of printify-service — every
 * `@Processor` in this domain calls into here rather than duplicating mapping
 * logic.
 */
@Injectable()
export class PrintifyNormalizerService {
  /**
   * @param raw Untyped response body from PrintifyApiService — cast to
   *   {@link IPrintifyRawProduct} here since Printify's API has no official
   *   TS types; the cast is trusted, not re-validated against the raw shape.
   * @throws Error if the normalized result fails `CreateProductDto` validation.
   */
  async normalize(raw: unknown, shopId: string): Promise<CreateProductDto> {
    const rawProduct = raw as IPrintifyRawProduct;

    // `position` must be the array index (display order), NOT Printify's own
    // `img.position` field — that's a shot-angle string ("front"/"back"),
    // semantically unrelated despite the identical field name.
    const images: ProductImageDto[] = rawProduct.images.map((img, index) => {
      const imageDto = new ProductImageDto();
      imageDto.url = img.src;
      imageDto.position = index;

      return imageDto;
    });

    // Printify prices are integer cents; the contract's `price` field is a
    // major-unit decimal (e.g. 1999 -> 19.99), hence the /100.
    const variants: ProductVariantDto[] = rawProduct.variants.map((variant) => {
      const variantDto = new ProductVariantDto();
      variantDto.title = variant.title;
      variantDto.sku = variant.sku;
      variantDto.price = variant.price / 100;
      variantDto.currency = 'USD';
      variantDto.options = {};

      return variantDto;
    });

    // Printify's `visible: boolean` has no matching field name in the shared
    // contract — mapped onto the `status` enum instead.
    const dto = plainToInstance(CreateProductDto, {
      sourcePlatform: E_SOURCE_PLATFORM.PRINTIFY,
      sourceProductId: rawProduct.id,
      title: rawProduct.title,
      description: rawProduct.description,
      tags: rawProduct.tags,
      images,
      variants,
      status: rawProduct.visible
        ? E_PRODUCT_STATUS.ACTIVE
        : E_PRODUCT_STATUS.DRAFT,
    });

    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new Error(
        `Invalid product after normalize: ${JSON.stringify(errors)}`,
      );
    }

    return dto;
  }
}

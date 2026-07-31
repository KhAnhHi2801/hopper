import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { E_PRODUCT_STATUS, E_SOURCE_PLATFORM } from './product.interface';
import { Type } from 'class-transformer';

/**
 * class-validator mirror of {@link ProductImage} — see that interface for
 * the `position` field's meaning (display order, not a platform-specific label).
 */
export class ProductImageDto {
  @IsString()
  url!: string;

  @IsNumber()
  @Min(0)
  position!: number;

  @IsOptional()
  @IsString()
  altText?: string;
}

/**
 * class-validator mirror of {@link ProductVariant}. `price` is validated as a
 * plain non-negative number — the major-unit-decimal contract (not integer
 * cents) is enforced by adapters during normalization, not by this decorator.
 */
export class ProductVariantDto {
  @IsString()
  sku!: string;

  @IsString()
  title!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsString()
  currency!: string;

  @IsObject()
  options!: Record<string, string>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  inventoryQuantity?: number;
}

/**
 * class-validator mirror of {@link Product} — the DTO every source adapter
 * validates its normalized output against before enqueueing, and every
 * sales-channel adapter validates on consume before mapping to its own
 * platform's API input shape. `@ValidateNested` + `@Type()` on `images`/
 * `variants` make class-validator recurse into the nested DTOs instead of
 * treating them as opaque objects.
 */
export class CreateProductDto {
  @IsEnum(E_SOURCE_PLATFORM)
  sourcePlatform!: E_SOURCE_PLATFORM;

  @IsString()
  sourceProductId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images!: ProductImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];

  @IsEnum(E_PRODUCT_STATUS)
  status!: E_PRODUCT_STATUS;
}

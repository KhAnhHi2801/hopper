/**
 * POD source platforms this system can import from. Only PRINTIFY has an
 * adapter implemented (services/printify-service); PRINTWAY/SHINEON are
 * reserved so the contract doesn't need a breaking change when they're added.
 */
export enum E_SOURCE_PLATFORM {
  PRINTIFY = 'printify',
  PRINTWAY = 'printway',
  SHINEON = 'shineon',
}

/**
 * Lifecycle status of a normalized product, independent of any specific
 * sales channel's own status vocabulary (e.g. Shopify's ACTIVE/DRAFT/ARCHIVED).
 */
export enum E_PRODUCT_STATUS {
  ACTIVE = 'active',
  DRAFT = 'draft',
}

/**
 * The shared intermediate product shape every source adapter (Printify, ...)
 * normalizes into, and every sales-channel adapter (Shopify, ...) maps out of.
 * This is the single contract that keeps source and destination platforms
 * decoupled from each other.
 */
export interface Product {
  sourcePlatform: E_SOURCE_PLATFORM;
  sourceProductId: string;
  title: string;
  description: string;
  vendor?: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  status: E_PRODUCT_STATUS;
}

/**
 * `position` is display order (0-based index in the gallery), not a
 * platform-specific label. Printify's own raw field of the same name is a
 * shot-angle string (e.g. "front") and must never be assigned here directly —
 * always derive `position` from the array index during normalization.
 */
export interface ProductImage {
  url: string;
  position: number;
  altText?: string;
}

export interface ProductVariant {
  sku: string;
  title: string;
  /** Major-unit decimal (e.g. 19.99), never integer cents. Source adapters
   * that receive integer-cents pricing (Printify does) must divide by 100
   * before populating this field. */
  price: number;
  /** ISO 4217 currency code, e.g. "USD". */
  currency: string;
  /** e.g. { color: 'Black', size: 'L' } */
  options: Record<string, string>;
  inventoryQuantity?: number;
}

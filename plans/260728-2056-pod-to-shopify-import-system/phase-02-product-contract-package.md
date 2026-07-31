---
title: 'Phase 2: Product contract package'
status: completed
---

# Phase 2: Product contract package

## Overview

Build the shared, platform-agnostic `Product` contract (`packages/product-contract`) that every adapter (printify-service now, shopify-service now, future adapters later) must validate against. This is the one piece of code shared across services — everything else stays independent.

## Requirements

- [x] `Product` TypeScript interface (platform-agnostic)
- [x] `CreateProductDto` class-validator DTO mirroring the interface 1:1
- [x] Jest tests covering valid input, invalid variant price, missing required fields

## Architecture

```ts
export interface Product {
  sourcePlatform: 'printify' | 'printway' | 'shineon'; // extensible; only printify implemented now
  sourceProductId: string;
  title: string;
  description: string;
  vendor?: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  status: 'draft' | 'active';
}
export interface ProductImage {
  url: string;
  position: number;
  altText?: string;
}
export interface ProductVariant {
  sku: string;
  title: string; // e.g. "Black / L"
  price: number; // major units, e.g. 19.99
  currency: string; // ISO 4217, e.g. "USD"
  options: Record<string, string>; // { color: 'Black', size: 'L' }
  inventoryQuantity?: number;
}
```

## Related Code Files

- Create: `packages/product-contract/src/product.interface.ts`
- Create: `packages/product-contract/src/product.dto.ts`
- Create: `packages/product-contract/src/*.spec.ts`

## Implementation Steps

1. Scaffold `packages/product-contract` as a workspace package (own `package.json`, builds via `tsc`).
2. Write the `Product`/`ProductImage`/`ProductVariant` interfaces above.
3. Write `CreateProductDto` + nested DTOs with class-validator decorators (`@IsEnum`, `@IsString`, `@IsArray`, `@ValidateNested({each:true})`, `@Type(() => ...)`, `@Min(0)` on price, currency validation).
4. Add `@hopper/product-contract` as a `workspace:*` dependency in printify-service and shopify-service `package.json` (not consumed yet, just wired).
5. Write Jest tests: valid product passes; negative price fails; missing `title` fails; empty `variants` array — decide and test whether that's allowed.

## Todo

- [x] Interface file
- [x] DTO file with full validation
- [x] Jest tests (valid + at least 2 invalid cases)
- [x] Package linked into printify-service and shopify-service via workspace:*

## Success Criteria

`npm test -w packages/product-contract` passes; both service `package.json` files resolve `@hopper/product-contract` via the workspace symlink (no npm registry involved).

## Resolution Notes

- Files: `src/product.interface.ts` (`E_SOURCE_PLATFORM`, `E_PRODUCT_STATUS` enums + `Product`/`ProductImage`/`ProductVariant` interfaces), `src/create-product.dto.ts` (`ProductImageDto`, `ProductVariantDto`, `CreateProductDto` with class-validator decorators), `src/create-product.dto.spec.ts` (3 Jest tests: valid input, negative variant price, missing required field).
- `tsconfig.base.json` was changed from `strictNullChecks: true` only to full `strict: true` (user's deliberate choice) — required adding `!` (definite assignment assertion) to all non-optional DTO/interface fields to satisfy `strictPropertyInitialization`.
- Runtime gotcha fixed: `class-validator` decorators need `Reflect.getMetadata`, not provided natively — required installing `reflect-metadata` as a real dependency (not devDependency, since any consumer needs it) and `import 'reflect-metadata'` as the first line of the spec file.
- npm workspace linking: `"workspace:*"` (pnpm/yarn syntax) is NOT valid in npm — correct syntax for a same-repo workspace dependency in npm is just `"*"`. Both `printify-service` and `shopify-service` `package.json` now depend on `@hopper/product-contract` via `"*"`, verified symlinked via `npm ls @hopper/product-contract -w services/printify-service -w services/shopify-service`.
- Verified: `npm test -w packages/product-contract` → 3/3 pass. `npx tsc -p packages/product-contract/tsconfig.json --noEmit` → clean.

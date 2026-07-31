---
title: "Phase 5: Shopify service"
status: todo
---

# Phase 5: Shopify service

## Overview

The destination adapter. Consumes normalized `ProductDto` jobs, maps to the Shopify **GraphQL** Admin API `productCreate` mutation input, calls Shopify, and reports the result back via `job-events` (never touches Postgres directly).

## Requirements

- [ ] `ShopifyGraphqlClient` — wraps `@shopify/shopify-api` or `graphql-request` against the Admin API
- [ ] `ShopifyMapperService` — `ProductDto` → `productCreate` GraphQL input (unit-tested, no live calls in tests)
- [ ] `@Processor('shopify-import')` — consumer
- [ ] Producers: `shopify-import-result`, `job-events`

## Architecture

Consume `shopify-import` job `{jobId, product: ProductDto, credential}` → map via `ShopifyMapperService` → call Shopify GraphQL `productCreate` mutation → on success/failure, produce `job-events(COMPLETED|FAILED)` (and optionally `shopify-import-result` if you want a separate result-detail queue vs folding into `job-events` — decide and document which).

## Related Code Files

- Create: `services/shopify-service/src/shopify/shopify-graphql.client.ts`
- Create: `services/shopify-service/src/shopify/shopify-mapper.service.ts`
- Create: `services/shopify-service/src/shopify/shopify-import.processor.ts`

## Implementation Steps

1. Set up the GraphQL client against Shopify Admin API (use a test/dev store — credential comes from the job payload, this service never stores it).
2. Build `ShopifyMapperService`: `ProductDto` → GraphQL `productCreate` input shape (title, descriptionHtml, vendor, tags, variants with price/sku/options, images). Unit test this mapping with fixture `ProductDto` objects — assert the exact GraphQL input shape, no live network calls.
3. Build `@Processor('shopify-import')`: consume → map → call Shopify → handle GraphQL `userErrors` (Shopify returns errors as data, not just HTTP errors — don't miss this) → produce result events.

## Todo

- [ ] Mapper unit-tested (valid ProductDto → correct GraphQL input; edge case like missing optional `vendor`)
- [ ] GraphQL `userErrors` handled explicitly, not just HTTP-level errors
- [ ] job-events produced on both success and failure paths

## Success Criteria

A `shopify-import` job with a valid `ProductDto` results in a product created on a test Shopify store, and a `job-events(COMPLETED)` message reaching orchestration-service; a deliberately malformed product results in `job-events(FAILED)` with a useful error captured.

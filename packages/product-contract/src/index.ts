// Barrel export — this is what @hopper/product-contract's package.json
// `main`/`types` fields point at (via the built dist/index.js). Any new
// public symbol in this package must be re-exported here or consumers
// can't import it.
export * from './product.interface';
export * from './create-product.dto';

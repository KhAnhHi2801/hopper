// Untyped shapes of Printify's actual API responses (no official Printify TS
// types exist). Kept separate from the shared `@hopper/product-contract`
// package since these describe an external, third-party JSON shape, not our
// own contract — only PrintifyNormalizerService should ever import these.

interface IPrintifyRawImage {
  src: string;
  /** Shot-angle label from Printify (e.g. "front"/"back") — NOT display
   * order. Never map this directly onto the contract's `ProductImage.position`. */
  position: string;
  is_default: boolean;
}

interface IPrintifyRawVariant {
  id: number;
  sku: string;
  title: string;
  price: number;
  is_enabled: boolean;
}

interface IPrintifyRawProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: IPrintifyRawImage[];
  variants: IPrintifyRawVariant[];
  visible: boolean;
}

export type { IPrintifyRawImage, IPrintifyRawVariant, IPrintifyRawProduct };

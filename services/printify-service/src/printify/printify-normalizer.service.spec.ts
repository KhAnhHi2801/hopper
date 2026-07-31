import { PrintifyNormalizerService } from './printify-normalizer.service';

const validRawProduct = {
  id: '5cb87245b8e5560001b3a1a2',
  title: 'Classic Tee',
  description: 'A great classic tee.',
  tags: ['t-shirt', 'unisex'],
  images: [
    {
      src: 'https://example.com/img1.png',
      position: 'front',
      is_default: true,
    },
  ],
  variants: [
    {
      id: 111,
      sku: 'TEE-BLK-L',
      title: 'Black / L',
      price: 1999,
      is_enabled: true,
    },
  ],
  visible: true,
};

// Fixture-based tests for the normalizer's two known traps: integer-cents ->
// major-unit price conversion, and Printify's `position` string vs. the
// contract's index-based `position` number. See printify-normalizer.service.ts.
describe('PrintifyNormalizerService', () => {
  const service = new PrintifyNormalizerService();

  it('normalizes a valid raw product into a valid CreateProductDto', async () => {
    const dto = await service.normalize(validRawProduct, 'shop-1');

    expect(dto.title).toBe('Classic Tee');
    expect(dto.variants[0].price).toBe(19.99); // 1999 cents -> 19.99
    expect(dto.images[0].position).toBe(0); // index, not "front"
    expect(dto.status).toBe('active'); // visible: true -> ACTIVE
  });

  it('throws when raw product is missing required fields', async () => {
    const invalidRawProduct = { ...validRawProduct, title: undefined };

    await expect(
      service.normalize(invalidRawProduct, 'shop-1'),
    ).rejects.toThrow();
  });
});

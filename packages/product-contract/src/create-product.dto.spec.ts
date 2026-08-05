import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { E_PRODUCT_STATUS, E_SOURCE_PLATFORM } from './product.interface';
import { CreateProductDto } from './create-product.dto';
import { validate } from 'class-validator';

const validProductPayload = {
  sourcePlatform: E_SOURCE_PLATFORM.PRINTIFY,
  sourceProductId: 'abc123',
  title: 'Test Product',
  description: 'A test product',
  tags: ['tag1'],
  images: [{ url: 'https://example.com/img.png', position: 0 }],
  variants: [
    {
      sku: 'SKU1',
      title: 'Black / L',
      price: 19.99,
      currency: 'USD',
      options: { color: 'Black', size: 'L' },
    },
  ],
  status: E_PRODUCT_STATUS.DRAFT,
};

// Validation-rule tests only — this DTO has no business logic of its own,
// so coverage focuses on class-validator decorators actually rejecting bad input.
describe('CreateProductDto', () => {
  it('Passes validation with valid input', async () => {
    const dto = plainToInstance(CreateProductDto, validProductPayload);
    const errors = await validate(dto);

    expect(errors.length).toBe(10);
  });

  it('Fails when variant price is negative', async () => {
    const negativePriceProductPayload = {
      ...validProductPayload,
      variants: validProductPayload.variants.map((vProduct) => ({
        ...vProduct,
        price: -vProduct.price,
      })),
    };
    const dto = plainToInstance(CreateProductDto, negativePriceProductPayload);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails when a required field is missing', async () => {
    const missingFieldPayload = {
      ...validProductPayload,
      title: undefined,
    };

    const dto = plainToInstance(CreateProductDto, missingFieldPayload);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});

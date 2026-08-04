import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsService } from './credentials.service';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

describe('CredentialsService', () => {
  let service: CredentialsService;
  let apiKey: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsService,
        { provide: PrismaService, useValue: {} }, // chưa dùng tới trong các test hiện tại
      ],
    }).compile();

    service = module.get<CredentialsService>(CredentialsService);
    process.env.MASTER_KEY = randomBytes(32).toString('base64');
    apiKey = 'It_is_the_api_key';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt/decrypt', () => {
    it('should decrypt back to original plaintext after encrypting', () => {
      const apiKeyEncrypted = service.encrypt(apiKey);
      const apiKeyDecrypted = service.decrypt(apiKeyEncrypted);

      expect(apiKeyDecrypted).toBe(apiKey);
    });

    it('should produce different ciphertext for the same plaintext on repeated calls (random IV)', () => {
      const apiKeyEncrypted1 = service.encrypt(apiKey);
      const apiKeyEncrypted2 = service.encrypt(apiKey);

      const ciphertext1 = apiKeyEncrypted1.ciphertext;
      const ciphertext2 = apiKeyEncrypted2.ciphertext;

      expect(ciphertext1).not.toEqual(ciphertext2);
    });

    it('should produce different wrappedDek for the same plaintext on repeated calls (random DEK + KEK IV)', () => {
      const apiKeyEncrypted1 = service.encrypt(apiKey);
      const apiKeyEncrypted2 = service.encrypt(apiKey);

      const wrappedDek1 = apiKeyEncrypted1.wrappedDek;
      const wrappedDek2 = apiKeyEncrypted2.wrappedDek;

      expect(wrappedDek1).not.toEqual(wrappedDek2);
    });

    it('should throw when ciphertext has been tampered with (GCM auth tag check)', () => {
      const apiKeyEncrypted = service.encrypt(apiKey);
      apiKeyEncrypted.ciphertext[0] ^= 0xff;

      expect(() => service.decrypt(apiKeyEncrypted)).toThrow();
    });

    it('should throw when wrappedDek has been tampered with (GCM auth tag check)', () => {
      const apiKeyEncrypted = service.encrypt(apiKey);
      apiKeyEncrypted.wrappedDek[0] ^= 0xff;

      expect(() => service.decrypt(apiKeyEncrypted)).toThrow();
    });

    it('should throw when MASTER_KEY env var is not set', () => {
      delete process.env.MASTER_KEY;

      expect(() => service.encrypt(apiKey)).toThrow();
    });
  });
});

import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Credential } from '../generated/prisma/client';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

interface EncryptedCredential {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  wrappedDek: Buffer;
}

@Injectable()
export class CredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  private getKek(): Buffer {
    const base64Kek = process.env.MASTER_KEY;

    if (!base64Kek) {
      throw new Error('MASTER_KEY env var is not set');
    }

    return Buffer.from(base64Kek, 'base64');
  }

  // Encrypts a plaintext secret using a fresh DEK, then wraps that DEK with the KEK
  encrypt(plaintext: string): EncryptedCredential {
    const kek = this.getKek();
    const dek = randomBytes(32);

    // layer 1: encrypt the real secret with the DEK
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, dek, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // layer 2: wrap the DEK with the KEK
    const kekIv = randomBytes(IV_LENGTH);
    const kekCipher = createCipheriv(ALGORITHM, kek, kekIv);
    const encryptedDek = Buffer.concat([
      kekCipher.update(dek),
      kekCipher.final(),
    ]);
    const kekAuthTag = kekCipher.getAuthTag();
    const wrappedDek = Buffer.concat([kekIv, kekAuthTag, encryptedDek]);

    return { ciphertext, iv, authTag, wrappedDek };
  }

  // Reverses `encrypt`: unwraps the DEK, then decrypts the real secret.
  decrypt(record: EncryptedCredential): string {
    const kek = this.getKek();

    // layer 2: unwrap the DEK
    const kekIv = record.wrappedDek.subarray(0, IV_LENGTH);
    const kekAuthTag = record.wrappedDek.subarray(
      IV_LENGTH,
      IV_LENGTH + AUTH_TAG_LENGTH,
    );
    const encryptedDek = record.wrappedDek.subarray(
      IV_LENGTH + AUTH_TAG_LENGTH,
    );
    const kekDecipher = createDecipheriv(ALGORITHM, kek, kekIv);
    kekDecipher.setAuthTag(kekAuthTag);

    const dek = Buffer.concat([
      kekDecipher.update(encryptedDek),
      kekDecipher.final(),
    ]);

    // layer 1: decrypt the real secret with the recovered DEK
    const decipher = createDecipheriv(ALGORITHM, dek, record.iv);
    decipher.setAuthTag(record.authTag);

    const plaintext = Buffer.concat([
      decipher.update(record.ciphertext),
      decipher.final(),
    ]);

    return plaintext.toString('utf8');
  }

  /** Encrypts `plaintext` and persists it as a new Credential row for `platform`. */
  async saveCredential(
    platform: string,
    plaintext: string,
  ): Promise<Credential> {
    const encrypted = this.encrypt(plaintext);

    return this.prisma.credential.create({
      data: {
        platform,
        ciphertext: new Uint8Array(encrypted.ciphertext),
        iv: new Uint8Array(encrypted.iv),
        authTag: new Uint8Array(encrypted.authTag),
        wrappedDek: new Uint8Array(encrypted.wrappedDek),
      },
    });
  }

  /** Loads the stored Credential for `platform` and returns the decrypted plaintext. */
  async getDecryptedCredential(platform: string): Promise<string> {
    const record = await this.prisma.credential.findFirst({
      where: { platform },
    });

    if (!record) {
      throw new Error(`No credential stored for platform "${platform}"`);
    }

    return this.decrypt({
      ciphertext: Buffer.from(record.ciphertext),
      iv: Buffer.from(record.iv),
      authTag: Buffer.from(record.authTag),
      wrappedDek: Buffer.from(record.wrappedDek),
    });
  }
}

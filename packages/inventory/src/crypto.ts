import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a plaintext string or object using AES-256-GCM.
 * The payload is stored as a formatted string: iv:authTag:ciphertext (all hex encoded)
 */
export function encryptPayload(data: string | object, hexKey: string): string {
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  const keyBuffer = Buffer.from(hexKey, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const textToEncrypt = typeof data === 'object' ? JSON.stringify(data) : data;
  let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a formatted AES-256-GCM payload string.
 */
export function decryptPayload<T = string>(encryptedFormatted: string, hexKey: string): T {
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  const parts = encryptedFormatted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const keyBuffer = Buffer.from(hexKey, 'hex');
  const iv = Buffer.from(ivHex!, 'hex');
  const authTag = Buffer.from(authTagHex!, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex!, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted) as T;
  } catch {
    return decrypted as unknown as T;
  }
}

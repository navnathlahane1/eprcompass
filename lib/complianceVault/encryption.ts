/**
 * AES-256-GCM server-side encryption for compliance credentials.
 * MUST only be imported in API routes / server components — never in client bundles.
 *
 * Requires env var: COMPLIANCE_VAULT_KEY (any string ≥ 16 chars; hashed to 256-bit key)
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES   = 12; // 96-bit nonce — optimal for GCM
const SEPARATOR  = '.';

function deriveKey(): Buffer {
  const secret = process.env.COMPLIANCE_VAULT_KEY;
  if (!secret) {
    // Dev fallback — NOT safe for production. Log a warning.
    console.warn('[ComplianceVault] COMPLIANCE_VAULT_KEY not set — using dev fallback key. Set this env var in production!');
    return createHash('sha256').update('dev-fallback-key-eprcertificate-vault-2025').digest();
  }
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext password string.
 * Returns a token of the form: base64(iv) . base64(authTag) . base64(ciphertext)
 */
export function encryptPassword(plaintext: string): string {
  const key = deriveKey();
  const iv  = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(SEPARATOR);
}

/**
 * Decrypt a token produced by encryptPassword().
 * Throws if the token is malformed or the key is wrong.
 */
export function decryptPassword(token: string): string {
  const key = deriveKey();
  const parts = token.split(SEPARATOR);
  if (parts.length !== 3) throw new Error('Invalid credential token format');
  const [ivB64, authTagB64, cipherB64] = parts;
  const iv        = Buffer.from(ivB64,       'base64');
  const authTag   = Buffer.from(authTagB64,  'base64');
  const ciphertext = Buffer.from(cipherB64,  'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Returns true if the value looks like an encrypted token.
 * Used to skip re-encryption when admin sends back the masked placeholder.
 */
export function isEncryptedToken(value: string): boolean {
  const parts = value.split(SEPARATOR);
  return parts.length === 3 && parts.every(p => p.length > 0);
}

/** Masked placeholder shown in UI — never the real ciphertext. */
export const MASKED = '••••••••';

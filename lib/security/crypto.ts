import crypto from 'node:crypto';
import { secrets } from '@/lib/security/secrets';

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function hmacSha256(value: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function normalizeForHash(value: unknown) {
  return JSON.stringify(sortObject(value));
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

export function createApiKey(mode: 'live' | 'test' = 'live') {
  const token = crypto.randomBytes(28).toString('base64url');
  return `sen_${mode}_${token}`;
}

export function hashApiKey(rawKey: string) {
  return sha256(`${rawKey}.${secrets.API_KEY_HASH_SECRET}`);
}

export function signCertificatePayload(payload: unknown) {
  const normalized = normalizeForHash(payload);
  const payloadHash = sha256(normalized);
  const signature = hmacSha256(payloadHash, secrets.CERTIFICATE_SIGNING_SECRET);
  const certificateHash = sha256(`${payloadHash}.${signature}`);

  return {
    normalized,
    payloadHash,
    signature,
    certificateHash
  };
}

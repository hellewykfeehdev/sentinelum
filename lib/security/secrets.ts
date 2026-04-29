import { requireMinLengthEnv } from '@/lib/env';

export function getSecrets() {
  return {
    CERTIFICATE_SIGNING_SECRET: requireMinLengthEnv('CERTIFICATE_SIGNING_SECRET', 32),
    API_KEY_HASH_SECRET: requireMinLengthEnv('API_KEY_HASH_SECRET', 32),
    WEBHOOK_SIGNING_SECRET: requireMinLengthEnv('WEBHOOK_SIGNING_SECRET', 32),
    ENCRYPTION_KEY: requireMinLengthEnv('ENCRYPTION_KEY', 32)
  };
}

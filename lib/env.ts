import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Sentinelum'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().default(''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  STRIPE_SECRET_KEY: z.string().default(''),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_PRICE_GROWTH_ANNUAL: z.string().optional(),
  STRIPE_PRICE_ANNUAL: z.string().optional(),
  STRIPE_PRICE_CERTIFICATE_USAGE: z.string().optional(),
  STRIPE_METERED_PRICE_CERTIFICATE: z.string().optional(),
  STRIPE_FREE_CERTIFICATES_INCLUDED: z.coerce.number().int().positive().default(10000),
  STRIPE_CERTIFICATE_UNIT_PRICE_CENTS: z.coerce.number().int().positive().default(5),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  RESEND_AUDIT_EMAIL: z.string().optional(),
  CERTIFICATE_SIGNING_SECRET: z.string().default(''),
  API_KEY_HASH_SECRET: z.string().default(''),
  WEBHOOK_SIGNING_SECRET: z.string().default(''),
  ENCRYPTION_KEY: z.string().default(''),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional()
});

export const env = envSchema.parse({
  ...process.env,
  NEXT_PUBLIC_APP_URL: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
});

export const stripePriceAnnual = env.STRIPE_PRICE_GROWTH_ANNUAL || env.STRIPE_PRICE_ANNUAL;
export const stripePriceUsage =
  env.STRIPE_PRICE_CERTIFICATE_USAGE || env.STRIPE_METERED_PRICE_CERTIFICATE;

export function requireEnv(key: keyof typeof env) {
  const value = env[key];
  if (!value || typeof value !== 'string') {
    throw Object.assign(new Error(`Missing required environment variable: ${key}`), {
      status: 500
    });
  }
  return value;
}

export function requireMinLengthEnv(key: keyof typeof env, minLength: number) {
  const value = requireEnv(key);
  if (value.length < minLength) {
    throw Object.assign(new Error(`Invalid environment variable: ${key}`), {
      status: 500
    });
  }
  return value;
}

export function assertBillingEnv() {
  if (!stripePriceAnnual) throw new Error('Missing annual Stripe price id');
  if (!stripePriceUsage) throw new Error('Missing certificate usage Stripe price id');
}

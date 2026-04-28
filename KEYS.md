# Sentinelum — Security Secrets Generation Instructions

## Goal

The app requires four internal security secrets. These values do **not** come from Stripe, Supabase, Cloudflare, Upstash, or Sentry.

They must be generated securely by the developer and added as environment variables in Vercel and any other production runtime.

Required variables:

```env
CERTIFICATE_SIGNING_SECRET=
API_KEY_HASH_SECRET=
WEBHOOK_SIGNING_SECRET=
ENCRYPTION_KEY=
```

## Important Rules

1. Never commit these values to GitHub.
2. Never expose these values in frontend/client-side code.
3. Never print them in public logs.
4. Generate different values for each variable.
5. Use different secrets for development, preview, and production if possible.
6. Store production values only in Vercel Environment Variables or a secure secret manager.
7. If any secret is leaked, rotate it immediately.

## How To Generate The Secrets

Use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run the command four times and assign one generated value to each variable:

```env
CERTIFICATE_SIGNING_SECRET=<generated-value-1>
API_KEY_HASH_SECRET=<generated-value-2>
WEBHOOK_SIGNING_SECRET=<generated-value-3>
ENCRYPTION_KEY=<generated-value-4>
```

Alternative using OpenSSL:

```bash
openssl rand -base64 32
```

Run it four times as well.

## What Each Secret Is Used For

### `CERTIFICATE_SIGNING_SECRET`

Used to sign Sentinelum oversight certificates.

Expected use:

- Generate a deterministic certificate payload.
- Hash the payload.
- Sign the hash using HMAC SHA-256 or another secure server-side signing method.
- Store the resulting signature in the certificate record.
- Show the signature/hash in the certificate PDF and verification endpoint.

This secret must only be used server-side.

### `API_KEY_HASH_SECRET`

Used to hash customer API keys before storing them in the database.

The system must never store raw customer API keys.

Expected API key flow:

1. Generate an API key for the customer.
2. Show the raw API key only once.
3. Hash the API key using `API_KEY_HASH_SECRET`.
4. Store only the hash in Supabase.
5. When a request comes in, hash the provided key and compare it with the stored hash.

Recommended API key format:

```txt
sk_sent_live_<random-token>
sk_sent_test_<random-token>
```

### `WEBHOOK_SIGNING_SECRET`

Used to sign outbound webhooks sent by Sentinelum to customer systems.

This is **not** the Stripe webhook secret.

Stripe uses:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Sentinelum should use:

```env
WEBHOOK_SIGNING_SECRET=<generated-value>
```

Expected use:

- When Sentinelum sends customer webhooks such as `certificate.created`, `certificate.failed`, or `usage.limit_reached`, sign the webhook payload.
- Include the signature in a request header such as:

```txt
x-sentinelum-signature: <signature>
x-sentinelum-timestamp: <timestamp>
```

### `ENCRYPTION_KEY`

Used to encrypt sensitive fields before storing them in Supabase when required.

Potential fields to encrypt:

- Sensitive certificate metadata.
- Human reviewer identity metadata.
- External system IDs.
- Customer-provided context.

If using AES-256-GCM, ensure the implementation expects a 32-byte key. The generated base64 value may need to be decoded before use.

## Required Implementation Behavior

The app must fail safely if production secrets are missing.

On server startup or before using any sensitive operation, validate that these environment variables exist:

```ts
const requiredEnv = [
  "CERTIFICATE_SIGNING_SECRET",
  "API_KEY_HASH_SECRET",
  "WEBHOOK_SIGNING_SECRET",
  "ENCRYPTION_KEY",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
```

Do not auto-generate production secrets at runtime.

## Do Not Auto-Generate In Production

Do **not** write code that silently generates these secrets automatically in production.

Bad behavior:

```ts
const secret = process.env.CERTIFICATE_SIGNING_SECRET || crypto.randomBytes(32).toString("base64");
```

Why this is bad:

- Certificates may become unverifiable after redeploy.
- API key hashes may stop matching.
- Webhook signatures may break.
- Encrypted data may become unreadable.

Acceptable behavior in local development only:

```ts
if (process.env.NODE_ENV !== "production") {
  // allow local fallback only if clearly documented
}
```

Production must require explicit environment variables.

## Where To Add These Values

### Vercel

Go to:

```txt
Vercel Dashboard
→ Project
→ Settings
→ Environment Variables
```

Add:

```env
CERTIFICATE_SIGNING_SECRET=<generated-value>
API_KEY_HASH_SECRET=<generated-value>
WEBHOOK_SIGNING_SECRET=<generated-value>
ENCRYPTION_KEY=<generated-value>
```

Apply to:

```txt
Production
Preview
Development
```

For real production, use separate values per environment.

## Recommended Helper File

Create:

```txt
/lib/security/secrets.ts
```

Example:

```ts
const required = {
  CERTIFICATE_SIGNING_SECRET: process.env.CERTIFICATE_SIGNING_SECRET,
  API_KEY_HASH_SECRET: process.env.API_KEY_HASH_SECRET,
  WEBHOOK_SIGNING_SECRET: process.env.WEBHOOK_SIGNING_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
};

for (const [key, value] of Object.entries(required)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const secrets = required as Record<keyof typeof required, string>;
```

## Required Deliverables

The developer must:

1. Generate the four secrets securely.
2. Add them to `.env.local` for development.
3. Add them to Vercel Environment Variables for production.
4. Add placeholders only to `.env.example`.
5. Ensure no real secret is committed to GitHub.
6. Implement validation for missing secrets.
7. Use the secrets only in server-side code.
8. Document how to rotate the secrets later.

## `.env.example` Should Contain Only Placeholders

```env
# SECURITY
CERTIFICATE_SIGNING_SECRET=
API_KEY_HASH_SECRET=
WEBHOOK_SIGNING_SECRET=
ENCRYPTION_KEY=
```

Never add real values to `.env.example`.

## Final Note

The developer may generate these secrets, but they must be generated once per environment and stored persistently. They must not be regenerated automatically during each deploy or server restart.

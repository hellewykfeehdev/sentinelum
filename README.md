# Sentinelum

Sentinelum is a B2B SaaS that creates cryptographic proof of human oversight for critical AI decisions. It includes a premium landing page, Supabase auth and Postgres, Stripe annual billing plus metered certificate usage, API key management, PDF certificates, public verification pages, R2 storage, Upstash rate limiting, Resend email hooks and Sentry-ready configuration.

## Install

```bash
npm install
npm run dev
```

Local app: `http://localhost:3000`

## Environment

Copy `.env.example` to `.env.local` and fill every production value. The four internal security secrets must be generated once per environment and must never be exposed client-side:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Generate separate values for `CERTIFICATE_SIGNING_SECRET`, `API_KEY_HASH_SECRET`, `WEBHOOK_SIGNING_SECRET` and `ENCRYPTION_KEY`.

## Supabase

1. Create a Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
3. For a fresh Supabase project, run `supabase/migrations/001_initial_schema.sql` in the SQL editor or through the Supabase CLI.
4. For the current project, also run `supabase/migrations/002_deploy_repair_schema.sql`. This repairs existing schemas that already have `workspaces`, enum `subscription_status`, or missing usage/billing tables.
5. Enable email/password auth.
6. In Supabase Auth URL configuration, set the site URL to your Vercel URL and add this redirect URL: `https://YOUR_DOMAIN/auth/callback`.
7. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.

## Stripe

Create two Prices, not Product IDs:

1. `Sentinelum Growth`, recurring yearly, USD 999. Set `STRIPE_PRICE_GROWTH_ANNUAL`.
2. `Sentinelum Certificate Usage`, metered recurring monthly, USD 0.05 per certificate. Set `STRIPE_PRICE_CERTIFICATE_USAGE`.

Required webhook endpoint:

```txt
https://sentinelum.cloud/api/stripe/webhook
```

Select:

```txt
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_succeeded
invoice.payment_failed
```

For local testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the returned `whsec_...` as `STRIPE_WEBHOOK_SECRET`.

## Cloudflare R2

Create a bucket, then set:

```env
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=
```

If `R2_PUBLIC_URL` is empty, Sentinelum still generates PDFs through the internal PDF route.

## Resend

Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `RESEND_AUDIT_EMAIL`. Payment failure emails are sent when Stripe marks an invoice as failed.

## Upstash

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. If unset, local development allows requests without external rate limiting.

## Vercel Deploy

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Add every `.env.example` variable in Vercel Environment Variables.
4. Set `NEXT_PUBLIC_APP_URL` to your final Vercel/custom domain without a trailing slash.
5. Run the Supabase migrations, including `002_deploy_repair_schema.sql` for the current database.
6. Configure the Stripe live webhook.
7. Redeploy after changing env vars.

## GitHub Safety

The repository includes a `.gitignore` that excludes `.env`, `.env.local`, `.next`, `node_modules`, logs and local build caches. Do not commit production secrets. Add real values only in Vercel Environment Variables and Supabase/Stripe dashboards.

## Certificate API Test

Create an API key in `/dashboard/api-keys`, then call:

```bash
curl -X POST https://sentinelum.cloud/api/v1/certificates \
  -H "Authorization: Bearer sen_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "ai_system_name":"Credit Copilot",
    "model_name":"gpt-5.5",
    "ai_output":"Approve customer for $5,000 credit line with medium risk.",
    "human_reviewer":{
      "name":"Sarah Mitchell",
      "email":"sarah@company.com",
      "role":"Risk Analyst"
    },
    "decision":"approved",
    "decision_notes":"Reviewed and approved.",
    "risk_flags":["credit","financial_decision"],
    "metadata":{"workflow_id":"credit_review_001"}
  }'
```

Expected response:

```json
{
  "id": "cert_xxx",
  "certificate_number": "SEN-2026-000001",
  "status": "issued",
  "certificate_hash": "sha256_hash",
  "verification_url": "https://sentinelum.cloud/verify/cert_xxx",
  "pdf_url": "https://..."
}
```

## Security Notes

- API keys are hashed before storage and the raw key is shown only once.
- Stripe webhooks use raw body signature verification and idempotency through `stripe_events`.
- Dashboard routes are protected through Supabase middleware.
- Certificate records are append-only. The migration blocks updates except initial `pdf_url` assignment.
- Service role keys are imported only in server-side modules.
- New certificate generation is blocked unless the workspace subscription is `active` or `trialing`.

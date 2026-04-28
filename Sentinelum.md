# Sentinelum — Production Build Prompt for Codex / GPT-5.5

You are a senior full-stack engineer. Build **Sentinelum**, a production-ready B2B SaaS that generates cryptographic proof of human oversight for critical AI decisions.

Sentinelum lets companies send an AI decision + human reviewer action to an API, then stores an immutable audit record, creates a signed certificate, generates a PDF, tracks usage, and supports annual Stripe billing plus per-certificate usage billing.

Do not build a toy MVP. Build a clean, secure, deployable product for real customers.

---

## 1. Tech Stack

Use:

- **Next.js 15+ App Router**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** for UI primitives
- **Framer Motion** for premium animations
- **Supabase** for Auth + Postgres
- **Stripe Billing** for annual subscription + metered usage
- **Cloudflare R2** for certificate PDF storage
- **Resend** for transactional emails
- **Upstash Redis** for rate limiting and usage protection
- **Sentry** for error monitoring
- **PDFKit or React PDF** for certificate generation
- **Zod** for request validation
- **Lucide React** for icons

Everything should live in one repo and one Next.js app. Backend routes must be implemented through Next.js API routes / route handlers.

---

## 2. Product Model

Initial pricing model:

- One annual plan only at launch.
- After successful Stripe checkout, unlock all app features.
- Track certificate usage per workspace.
- Allow included quota and usage-based billing after quota.

Initial plan example:

- `Sentinelum Annual`
- Annual subscription
- Includes a configurable amount of certificates
- Extra certificates billed through Stripe metered usage

Do not hardcode pricing in business logic. Store plan/quota values in config or database.

---

## 3. Core User Flow

### Public flow

1. User lands on the landing page.
2. User clicks CTA.
3. User creates account or logs in.
4. User is sent to Stripe Checkout for the annual plan.
5. Stripe webhook confirms payment.
6. System creates/updates workspace subscription status.
7. User is redirected to `/dashboard`.
8. Dashboard unlocks all customer features.

### Customer flow

1. Customer creates workspace.
2. Customer generates API key.
3. Customer calls Sentinelum API with AI output and human review data.
4. API validates key, subscription, payload and rate limit.
5. API creates hash and signed certificate record.
6. API generates certificate PDF.
7. API uploads PDF to R2.
8. API records usage and sends metered usage event to Stripe if needed.
9. Dashboard shows certificates, usage, audit logs and billing state.

---

## 4. Required Pages

Create these pages:

```txt
/
/pricing
/login
/signup
/dashboard
/dashboard/certificates
/dashboard/certificates/[id]
/dashboard/api-keys
/dashboard/usage
/dashboard/billing
/dashboard/settings
/api-docs
/verify/[certificateId]
```

### Public pages

- `/`: premium landing page.
- `/pricing`: annual plan and CTA to checkout.
- `/api-docs`: API example and developer documentation.
- `/verify/[certificateId]`: public verification page for a certificate.

### App pages

- `/dashboard`: overview metrics.
- `/dashboard/certificates`: searchable certificate table.
- `/dashboard/certificates/[id]`: certificate details + PDF download + verification link.
- `/dashboard/api-keys`: create/revoke/copy API keys.
- `/dashboard/usage`: quota, total calls, billable calls.
- `/dashboard/billing`: Stripe customer portal link and subscription state.
- `/dashboard/settings`: workspace settings.

---

## 5. Required API Routes

Implement:

```txt
POST /api/stripe/checkout
POST /api/stripe/webhook
POST /api/stripe/portal

POST /api/api-keys
GET  /api/api-keys
DELETE /api/api-keys/[id]

POST /api/v1/certificates
GET  /api/v1/certificates
GET  /api/v1/certificates/[id]
GET  /api/v1/certificates/[id]/pdf

GET /api/verify/[certificateId]
GET /api/usage
```

The external customer API is:

```txt
POST /api/v1/certificates
```

It must accept an API key through:

```txt
Authorization: Bearer sk_live_xxx
```

---

## 6. Certificate API Payload

Request body:

```json
{
  "ai_system_name": "Credit Copilot",
  "model_name": "gpt-5.5",
  "ai_output": "Approve customer for $5,000 credit line with medium risk.",
  "human_reviewer": {
    "name": "Sarah Mitchell",
    "email": "sarah@company.com",
    "role": "Risk Analyst"
  },
  "decision": "approved",
  "decision_notes": "Reviewed score, verified income and approved.",
  "risk_flags": ["credit", "financial_decision"],
  "metadata": {
    "customer_id": "hashed_customer_id",
    "workflow_id": "credit_review_001"
  }
}
```

Allowed decisions:

```txt
approved
modified
rejected
escalated
```

Response:

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

---

## 7. Cryptographic Proof Requirements

For every certificate:

1. Normalize the relevant payload.
2. Create `ai_output_hash` using SHA-256.
3. Create `payload_hash` using SHA-256 over normalized certificate payload.
4. Create `signature` using HMAC-SHA256 with `CERTIFICATE_SIGNING_SECRET`.
5. Store all hashes, signature, timestamp and certificate metadata.
6. Make records append-only as much as possible.
7. Never store raw sensitive customer data unless needed. Prefer hashes in metadata.

Certificate must include:

- Certificate ID
- Certificate number
- Workspace/company name
- AI system name
- Model name
- AI output hash
- Human reviewer name/email/role
- Decision
- Decision notes
- Risk flags
- Timestamp UTC
- Payload hash
- Signature
- Verification URL
- QR code if easy to implement

---

## 8. Database Schema

Use Supabase/Postgres. Create SQL migrations.

Tables:

### profiles

- id uuid primary key references auth.users
- email text
- full_name text
- created_at timestamptz

### workspaces

- id uuid primary key
- name text
- owner_id uuid references profiles(id)
- subscription_status text
- stripe_customer_id text
- stripe_subscription_id text
- plan_id text
- annual_quota int
- current_period_start timestamptz
- current_period_end timestamptz
- created_at timestamptz

### workspace_members

- id uuid primary key
- workspace_id uuid references workspaces(id)
- user_id uuid references profiles(id)
- role text check in owner/admin/member
- created_at timestamptz

### api_keys

- id uuid primary key
- workspace_id uuid references workspaces(id)
- name text
- key_prefix text
- key_hash text
- last_used_at timestamptz
- revoked_at timestamptz
- created_at timestamptz

### certificates

- id uuid primary key
- workspace_id uuid references workspaces(id)
- certificate_number text unique
- ai_system_name text
- model_name text
- ai_output_hash text
- human_reviewer_name text
- human_reviewer_email text
- human_reviewer_role text
- decision text
- decision_notes text
- risk_flags text[]
- metadata jsonb
- payload_hash text
- certificate_hash text
- signature text
- pdf_url text
- status text
- issued_at timestamptz
- created_at timestamptz

### usage_events

- id uuid primary key
- workspace_id uuid references workspaces(id)
- certificate_id uuid references certificates(id)
- event_type text
- quantity int
- stripe_reported boolean default false
- created_at timestamptz

### audit_logs

- id uuid primary key
- workspace_id uuid references workspaces(id)
- actor_id uuid nullable
- action text
- target_type text
- target_id text
- metadata jsonb
- created_at timestamptz

Enable RLS. Users should only access workspaces they belong to. API key routes should only access their own workspace.

---

## 9. Stripe Requirements

Implement:

- Checkout session creation for annual plan.
- Stripe webhook verification.
- Handle at least:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Create Stripe customer if needed.
- Store customer/subscription IDs.
- Unlock dashboard only if subscription is active/trialing or manually marked active.
- Add customer portal route.
- Track certificate usage and prepare for metered billing.

Use env vars, not hardcoded IDs.

---

## 10. Security Requirements

- Validate all external inputs with Zod.
- Hash API keys before storing.
- Show full API key only once after creation.
- Rate limit API routes with Upstash.
- Verify Stripe webhooks using raw body/signature.
- Never expose service role keys to the browser.
- Protect dashboard routes.
- Add basic audit logs for critical actions.
- Use secure error messages.
- Add CORS policy for external API if needed.

---

## 11. UI/UX Requirements

Build a premium enterprise interface.

Style:

- Dark mode first.
- Technical grid background.
- Glass cards.
- Cyan/blue accent.
- High contrast.
- No generic AI robot imagery.
- Smooth but lightweight animations.
- Product should feel like Stripe, Vercel, Cloudflare and Palantir.

Dashboard must include:

- Total certificates
- Certificates this period
- Included quota used
- Billable usage
- Approved/modified/rejected/escalated count
- Recent certificates
- API key status
- Subscription status

Certificate detail page must show:

- Status
- Certificate number
- Human reviewer
- Decision
- AI system/model
- Hashes/signature
- PDF download
- Public verification URL

---

## 12. Landing Page Requirements

Landing page must be premium and non-generic. Use the separate LP brief if provided.

Must include:

- Hero with strong headline.
- Looping digital certificate video asset if present.
- Product flow: AI output → human review → cryptographic stamp → certificate.
- API code block.
- Dashboard/certificate preview.
- Use cases.
- Pricing CTA.
- Final CTA.

Primary copy:

```txt
AI is making decisions. Sentinelum proves who stayed in control.
```

Subcopy:

```txt
Generate cryptographic evidence of human oversight for every critical AI decision — with timestamps, reviewer identity, immutable hashes, PDFs and audit-ready API logs.
```

---

## 13. Environment Variables

Create `.env.example`:

```env
NEXT_PUBLIC_APP_NAME=Sentinelum
NEXT_PUBLIC_APP_URL=https://sentinelum.cloud
NEXT_PUBLIC_DASHBOARD_URL=https://sentinelum.cloud/dashboard
NODE_ENV=production

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ANNUAL=
STRIPE_METERED_PRICE_CERTIFICATE=
STRIPE_CUSTOMER_PORTAL_RETURN_URL=

CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=sentinelum-certificates
R2_ENDPOINT=
R2_PUBLIC_URL=

RESEND_API_KEY=
RESEND_FROM_EMAIL=Sentinelum <noreply@sentinelum.cloud>
RESEND_AUDIT_EMAIL=audit@sentinelum.cloud

CERTIFICATE_SIGNING_SECRET=
API_KEY_HASH_SECRET=
WEBHOOK_SIGNING_SECRET=
ENCRYPTION_KEY=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

---

## 14. Deliverables

Return a complete repository with:

- Working Next.js app.
- Database migrations.
- Auth flow.
- Stripe annual checkout.
- Stripe webhook.
- Dashboard.
- API key management.
- Certificate creation API.
- PDF certificate generation.
- R2 upload.
- Public verification page.
- Usage tracking.
- Rate limiting.
- `.env.example`.
- README with setup/deploy instructions.

---

## 15. README Requirements

README must explain:

1. How to install dependencies.
2. How to configure Supabase.
3. How to run migrations.
4. How to configure Stripe products/prices/webhooks.
5. How to configure R2.
6. How to configure Resend.
7. How to configure Upstash.
8. How to deploy to Vercel.
9. How to test certificate API with curl.

Include curl example:

```bash
curl -X POST https://sentinelum.cloud/api/v1/certificates \
  -H "Authorization: Bearer sk_live_xxx" \
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

---

## 16. Quality Bar

Before finishing:

- Run TypeScript checks.
- Run linting.
- Ensure all routes compile.
- Ensure no secret is exposed client-side.
- Ensure dashboard is protected.
- Ensure API rejects unpaid/inactive workspaces.
- Ensure PDF generation works.
- Ensure Stripe webhook updates subscription state.
- Ensure API key auth works.
- Ensure public verification works.
- Ensure UI is polished and responsive.

Build the product as if it will be sold to real companies immediately.

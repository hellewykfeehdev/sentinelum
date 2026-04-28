# Sentinelum — Stripe Payment Logic, Webhook, Supabase Integration and Usage Billing

This document defines the complete payment logic for Sentinelum using Stripe + Supabase + Next.js API routes.

Production webhook endpoint:

```txt
https://sentinelum.cloud/api/stripe/webhook
```

The product starts with one annual plan and usage-based billing for extra generated certificates.

---

## 1. Billing Model

Sentinelum uses:

```txt
Annual subscription = unlocks platform access
+
Usage-based billing = charges extra certificates above included allowance
```

Initial commercial plan:

```txt
Plan name: Sentinelum Growth
Price: USD 999/year
Included certificates: 10,000/year
Extra usage: USD 0.05 per certificate above allowance
```

The app must not unlock paid features until Stripe confirms the subscription is active or trialing.

---

## 2. Stripe Products and Prices

Create two Stripe products/prices.

### 2.1 Product 1 — Annual Plan

Stripe product:

```txt
Product name: Sentinelum Growth
Description: Annual access to Sentinelum human oversight certificates, dashboard, API keys, audit logs and certificate generation.
```

Price configuration:

```txt
Pricing model: Standard pricing
Amount: 999.00
Currency: USD
Billing type: Recurring
Billing period: Yearly
```

Copy the Stripe **Price ID**, not Product ID.

Correct format:

```txt
price_xxxxxxxxx
```

Environment variable:

```env
STRIPE_PRICE_GROWTH_ANNUAL=price_xxxxxxxxx
```

Do not use:

```txt
prod_xxxxxxxxx
```

### 2.2 Product 2 — Certificate Usage

Stripe product:

```txt
Product name: Sentinelum Certificate Usage
Description: Usage-based billing for additional oversight certificates generated above the included annual allowance.
```

Price configuration:

```txt
Pricing model: Usage-based / Metered
Amount: 0.05
Currency: USD
Billing type: Recurring
Billing period: Monthly
Usage aggregation: Sum
Unit: certificate
```

Copy the Stripe **Price ID**.

Environment variable:

```env
STRIPE_PRICE_CERTIFICATE_USAGE=price_xxxxxxxxx
```

### 2.3 Allowance Config

Use environment variables so the business can change allowance/pricing later without editing core logic.

```env
STRIPE_FREE_CERTIFICATES_INCLUDED=10000
STRIPE_CERTIFICATE_UNIT_PRICE_CENTS=5
```

---

## 3. Required Stripe Environment Variables

```env
# Stripe API keys
STRIPE_SECRET_KEY=sk_test_or_live_xxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_xxxxxxxxx

# Stripe webhook
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx

# Stripe prices
STRIPE_PRICE_GROWTH_ANNUAL=price_xxxxxxxxx
STRIPE_PRICE_CERTIFICATE_USAGE=price_xxxxxxxxx

# Usage config
STRIPE_FREE_CERTIFICATES_INCLUDED=10000
STRIPE_CERTIFICATE_UNIT_PRICE_CENTS=5
```

Important:

- Use `sk_test_`, `pk_test_`, `price_...` from test mode during development.
- Use `sk_live_`, `pk_live_`, and live `price_...` in production.
- Test Price IDs and Live Price IDs are different.
- Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in the frontend.

---

## 4. Required Supabase Tables

The payment system must be linked to Supabase.

Minimum tables:

```txt
profiles
workspaces
workspace_members
api_keys
certificates
usage_events
stripe_events
invoices
```

---

## 5. Supabase Schema

### 5.1 profiles

Stores app users.

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 5.2 workspaces

Stores the customer/company account.

```sql
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references profiles(id) on delete cascade,

  plan text default 'free',
  subscription_status text default 'none',

  stripe_customer_id text unique,
  stripe_subscription_id text unique,

  annual_certificate_allowance integer default 10000,
  usage_period_start timestamptz,
  usage_period_end timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Recommended subscription statuses:

```txt
none
incomplete
trialing
active
past_due
unpaid
canceled
```

Access should be allowed only when:

```txt
subscription_status IN ('active', 'trialing')
```

### 5.3 workspace_members

```sql
create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'owner',
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);
```

### 5.4 api_keys

Store hashed API keys only. Never store the raw API key.

```sql
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now()
);
```

### 5.5 certificates

```sql
create table certificates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,

  ai_system_name text,
  model_name text,
  decision text not null,

  human_reviewer_id text,
  human_reviewer_email text,
  human_reviewer_name text,

  ai_output_hash text not null,
  payload_hash text not null,
  certificate_hash text not null unique,
  signature text not null,

  risk_flags jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,

  pdf_url text,
  verification_url text,

  created_at timestamptz default now()
);
```

### 5.6 usage_events

Every certificate generation must create one usage event.

```sql
create table usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  certificate_id uuid references certificates(id) on delete set null,

  event_type text not null default 'certificate.generated',
  quantity integer not null default 1,

  included_in_plan boolean default true,
  reported_to_stripe boolean default false,
  stripe_event_id text,

  created_at timestamptz default now()
);
```

### 5.7 stripe_events

Store processed Stripe event IDs for idempotency.

```sql
create table stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz default now(),
  payload jsonb
);
```

### 5.8 invoices

```sql
create table invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  stripe_invoice_id text unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  amount_paid integer,
  amount_due integer,
  currency text,
  hosted_invoice_url text,
  invoice_pdf text,
  created_at timestamptz default now()
);
```

---

## 6. Checkout Flow

After the user clicks the pricing CTA, create a Stripe Checkout Session.

Route:

```txt
POST /api/stripe/checkout
```

Expected behavior:

1. User must be authenticated.
2. User must have or create a workspace.
3. Create or reuse a Stripe Customer.
4. Create Checkout Session in subscription mode.
5. Add annual plan line item.
6. Add usage-based price line item.
7. Add `user_id` and `workspace_id` to metadata.
8. Redirect user to Stripe Checkout.

Success URL:

```txt
https://sentinelum.cloud/dashboard?checkout=success
```

Cancel URL:

```txt
https://sentinelum.cloud/pricing?checkout=cancelled
```

### 6.1 Checkout Session Code Example

```ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: stripeCustomerId,
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
  line_items: [
    {
      price: process.env.STRIPE_PRICE_GROWTH_ANNUAL!,
      quantity: 1,
    },
    {
      price: process.env.STRIPE_PRICE_CERTIFICATE_USAGE!,
    },
  ],
  metadata: {
    user_id: user.id,
    workspace_id: workspace.id,
    plan: 'growth',
  },
  subscription_data: {
    metadata: {
      user_id: user.id,
      workspace_id: workspace.id,
      plan: 'growth',
    },
  },
});
```

Return:

```ts
return NextResponse.json({ url: session.url });
```

The frontend should redirect:

```ts
window.location.href = data.url;
```

---

## 7. Webhook Endpoint

Webhook route:

```txt
POST /api/stripe/webhook
```

Production URL configured in Stripe:

```txt
https://sentinelum.cloud/api/stripe/webhook
```

The webhook must verify Stripe signature using:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

Do not parse the body as JSON before signature verification. Use raw body text.

---

## 8. Required Webhook Events

Configure these events in Stripe:

```txt
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
```

Optional later:

```txt
invoice.upcoming
customer.created
payment_method.attached
```

---

## 9. Webhook Event Logic

### 9.1 Idempotency Rule

Before processing any Stripe event:

1. Check if `event.id` exists in `stripe_events`.
2. If yes, return `{ received: true, duplicate: true }`.
3. If no, process event.
4. Insert event into `stripe_events` after successful processing.

This prevents duplicate processing.

---

### 9.2 `checkout.session.completed`

When the checkout is completed:

Read:

```txt
session.customer
session.subscription
session.metadata.user_id
session.metadata.workspace_id
session.metadata.plan
```

Update workspace:

```txt
stripe_customer_id = session.customer
stripe_subscription_id = session.subscription
plan = 'growth'
subscription_status = 'active' or 'incomplete_until_subscription_event_arrives'
annual_certificate_allowance = 10000
```

Recommended behavior:

- If subscription object is immediately retrievable, fetch it from Stripe and use real status.
- If not, store `pending`/`incomplete` and wait for `customer.subscription.created` or `customer.subscription.updated`.

Do not generate API keys automatically unless product decision says so. Recommended: after payment, dashboard shows button to create API key.

---

### 9.3 `customer.subscription.created`

When a subscription is created:

Read:

```txt
subscription.id
subscription.customer
subscription.status
subscription.current_period_start
subscription.current_period_end
subscription.items.data
subscription.metadata.workspace_id
```

Update workspace by:

1. `stripe_subscription_id`, or
2. `stripe_customer_id`, or
3. `subscription.metadata.workspace_id`

Update:

```txt
stripe_customer_id
stripe_subscription_id
subscription_status
plan = 'growth'
usage_period_start = current_period_start
usage_period_end = current_period_end
annual_certificate_allowance = 10000
```

If status is `active` or `trialing`, unlock dashboard and API generation.

---

### 9.4 `customer.subscription.updated`

When subscription changes:

Update workspace:

```txt
subscription_status = subscription.status
usage_period_start = current_period_start
usage_period_end = current_period_end
```

Access rules:

```txt
active   -> allow dashboard and certificate generation
trialing -> allow dashboard and certificate generation
past_due -> allow dashboard, show payment warning, optionally allow API for grace period
unpaid   -> block certificate generation
canceled -> block certificate generation
incomplete -> block certificate generation
```

If period changed, this means a new billing period started. The app should consider usage reset based on `usage_period_start` and `usage_period_end`, not by manually deleting old events.

---

### 9.5 `customer.subscription.deleted`

When subscription is canceled or deleted:

Update workspace:

```txt
subscription_status = 'canceled'
```

Behavior:

- Block new certificate generation.
- Keep dashboard read-only.
- Keep existing certificates accessible.
- Do not delete any certificate or audit log.

---

### 9.6 `invoice.paid`

When an invoice is paid:

Read:

```txt
invoice.id
invoice.customer
invoice.subscription
invoice.status
invoice.amount_paid
invoice.amount_due
invoice.currency
invoice.hosted_invoice_url
invoice.invoice_pdf
```

Store/update `invoices` table.

Find workspace by:

```txt
stripe_customer_id
stripe_subscription_id
```

Update:

```txt
subscription_status = 'active'
```

If this invoice represents a new annual cycle, usage allowance should effectively reset because counting is based on the subscription period.

---

### 9.7 `invoice.payment_failed`

When payment fails:

Store invoice.

Update workspace:

```txt
subscription_status = 'past_due'
```

Behavior:

- Show warning in dashboard.
- Send email to workspace owner.
- Optionally allow certificate generation for a short grace period.
- If Stripe later changes subscription to `unpaid`, block generation.

---

## 10. Webhook Implementation Template

File:

```txt
app/api/stripe/webhook/route.ts
```

```ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: existingEvent } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        break;
    }

    await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
      payload: event as any,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
```

The handler functions should be implemented in a separate file such as:

```txt
lib/stripe/webhook-handlers.ts
```

---

## 11. Certificate API Usage Logic

Certificate creation route:

```txt
POST /api/certificates
```

Also expose public API route if desired:

```txt
POST /v1/certificates
```

Every certificate generation must follow this logic:

```txt
1. Authenticate request.
2. If dashboard request, use user session.
3. If API request, validate API key.
4. Resolve workspace.
5. Check workspace subscription status.
6. If status is not active/trialing, block generation.
7. Validate payload.
8. Generate certificate hash and signature.
9. Create certificate row.
10. Generate PDF.
11. Upload PDF to Cloudflare R2.
12. Update certificate row with pdf_url and verification_url.
13. Create usage_events row.
14. Calculate usage in current subscription period.
15. If usage is above included allowance, report usage to Stripe.
16. Return certificate data.
```

Allowed subscription statuses:

```ts
const allowed = ['active', 'trialing'];
```

Blocked statuses:

```ts
const blocked = ['none', 'incomplete', 'unpaid', 'canceled'];
```

For `past_due`, choose one:

```txt
Option A: block immediately.
Option B: allow dashboard read-only and block API calls.
Option C: allow 3-7 day grace period.
```

Recommended MVP: block certificate generation for `past_due` to avoid unpaid usage risk.

---

## 12. Usage Counting Logic

Usage must be counted per workspace and current billing period.

Use:

```txt
workspace.usage_period_start
workspace.usage_period_end
```

Query:

```sql
select coalesce(sum(quantity), 0) as total
from usage_events
where workspace_id = :workspace_id
and event_type = 'certificate.generated'
and created_at >= :usage_period_start
and created_at < :usage_period_end;
```

If total usage is less than or equal to allowance:

```txt
included_in_plan = true
reported_to_stripe = false
```

If total usage exceeds allowance:

```txt
included_in_plan = false
reported_to_stripe = true after successful Stripe reporting
```

Example:

```txt
Allowance: 10,000
Current usage before call: 10,000
New certificate: 10,001
This new usage event is extra and should be reported to Stripe.
```

---

## 13. Reporting Usage to Stripe

Use Stripe usage-based billing for extra certificates.

The backend should only report usage to Stripe when:

```txt
current_period_usage > annual_certificate_allowance
```

Report exactly `quantity = 1` for each extra certificate.

Pseudo-code:

```ts
const usageAfterInsert = await getCurrentPeriodUsage(workspace.id);
const allowance = workspace.annual_certificate_allowance ?? 10000;

const isExtraUsage = usageAfterInsert > allowance;

await supabase.from('usage_events').insert({
  workspace_id: workspace.id,
  certificate_id: certificate.id,
  event_type: 'certificate.generated',
  quantity: 1,
  included_in_plan: !isExtraUsage,
  reported_to_stripe: false,
});

if (isExtraUsage) {
  const stripeEventId = await reportCertificateUsageToStripe({
    stripeCustomerId: workspace.stripe_customer_id,
    quantity: 1,
    eventName: 'certificate.generated',
  });

  await supabase
    .from('usage_events')
    .update({
      reported_to_stripe: true,
      stripe_event_id: stripeEventId,
    })
    .eq('certificate_id', certificate.id);
}
```

Important:

- Do not report the first 10,000 included certificates to Stripe usage billing.
- Only report extra certificates.
- Always store local usage in Supabase.
- If Stripe reporting fails, certificate creation can either fail or be marked as `reported_to_stripe = false` for retry.

Recommended behavior:

```txt
If Stripe usage reporting fails for extra usage, do not silently ignore it.
Mark usage event as unreported and retry using a scheduled job/admin repair script.
```

---

## 14. API Key Rules

After payment is active, customer can create API keys in dashboard.

Route:

```txt
POST /api/api-keys
```

Rules:

1. Only workspace owner/admin can create API keys.
2. Raw key shown only once.
3. Store only hash.
4. Key format should be identifiable.

Example key format:

```txt
sen_live_xxxxxxxxxxxxxxxxxxxxx
sen_test_xxxxxxxxxxxxxxxxxxxxx
```

Store:

```txt
key_prefix = first 12 characters
key_hash = sha256(raw_key + API_KEY_HASH_SECRET)
```

When customer calls public API:

```txt
Authorization: Bearer sen_live_xxxxx
```

Backend:

1. Hash provided key.
2. Find matching key_hash.
3. Check not revoked.
4. Resolve workspace.
5. Check subscription status.
6. Continue certificate creation.

---

## 15. Post-Purchase User Flow

After successful payment:

```txt
1. Stripe redirects user to /dashboard?checkout=success.
2. Dashboard checks workspace subscription status from Supabase.
3. If active/trialing, show full dashboard.
4. If still pending, show: "Payment received. Activating your workspace..." and poll status.
5. User can create API key.
6. User can generate test certificate.
7. User can see usage meter.
```

Dashboard modules unlocked after active subscription:

```txt
- Certificates list
- Generate certificate manually
- API keys
- Usage dashboard
- Billing status
- Certificate verification links
- PDF download
- Webhook documentation
```

---

## 16. Dashboard Usage Meter

Show customer:

```txt
Included certificates: 10,000/year
Used this period: X
Remaining included: Y
Extra certificates: Z
Estimated extra charges: Z * $0.05
```

Calculation:

```ts
const included = 10000;
const used = currentPeriodUsage;
const remaining = Math.max(included - used, 0);
const extra = Math.max(used - included, 0);
const estimatedExtraCents = extra * 5;
```

Display:

```txt
8,230 / 10,000 included certificates used
1,770 included certificates remaining
0 extra certificates billed
```

If exceeded:

```txt
10,420 / 10,000 included certificates used
420 extra certificates
Estimated extra charge: $21.00
```

---

## 17. Billing Portal

Create route:

```txt
POST /api/stripe/billing-portal
```

This lets customer manage card, invoices and subscription.

Logic:

1. User must be authenticated.
2. Resolve workspace.
3. Check `stripe_customer_id` exists.
4. Create Stripe billing portal session.
5. Redirect to portal URL.

Return URL:

```txt
https://sentinelum.cloud/dashboard/billing
```

---

## 18. Required API Routes

```txt
POST /api/stripe/checkout
POST /api/stripe/webhook
POST /api/stripe/billing-portal
GET  /api/billing/status
GET  /api/usage/current
POST /api/api-keys
GET  /api/api-keys
DELETE /api/api-keys/:id
POST /api/certificates
GET  /api/certificates
GET  /api/certificates/:id
GET  /api/certificates/:id/pdf
POST /v1/certificates
GET  /v1/certificates/:id
```

The `/v1/*` routes are for customer API usage.
The `/api/*` routes are for dashboard/internal app usage.

---

## 19. Security Requirements

Mandatory:

```txt
- Verify Stripe webhook signature.
- Use Supabase service role only on server-side routes.
- Never expose service role key to frontend.
- Never store raw API keys.
- Check workspace ownership on every dashboard route.
- Check subscription status before certificate generation.
- Add rate limiting to public API routes.
- Make webhook idempotent with stripe_events table.
- Keep existing certificates immutable.
- Do not allow certificate content to be edited after creation.
```

---

## 20. Local Stripe Testing

Use Stripe CLI.

Login:

```bash
stripe login
```

Forward webhook to local app:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI returns a webhook secret:

```txt
whsec_xxxxxxxxx
```

Use that in local `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

Test card:

```txt
4242 4242 4242 4242
Any future date
Any CVC
```

Trigger test events:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

Note: Some triggered events may not include the same metadata as real Checkout Sessions. Always test a real Checkout flow in Stripe test mode.

---

## 21. Production Stripe Setup Checklist

Before going live:

```txt
1. Activate Stripe account.
2. Create live Sentinelum Growth product.
3. Create live annual price.
4. Copy live STRIPE_PRICE_GROWTH_ANNUAL.
5. Create live Sentinelum Certificate Usage product.
6. Create live metered/usage price.
7. Copy live STRIPE_PRICE_CERTIFICATE_USAGE.
8. Add webhook endpoint:
   https://sentinelum.cloud/api/stripe/webhook
9. Select webhook events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.paid
   - invoice.payment_failed
10. Copy live STRIPE_WEBHOOK_SECRET.
11. Copy live STRIPE_SECRET_KEY.
12. Copy live NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
13. Add all env vars to Vercel production.
14. Redeploy Vercel.
15. Run a real small payment test if possible.
```

---

## 22. Final Acceptance Criteria

Payment system is complete only when all these work:

```txt
- User can create account.
- User can click pricing CTA.
- Stripe Checkout opens with annual plan.
- Checkout subscription includes annual price and usage price.
- After payment, user returns to /dashboard.
- Webhook receives checkout.session.completed.
- Workspace stores Stripe customer/subscription IDs.
- Subscription status becomes active.
- Paid user can create API key.
- Paid user can generate certificate.
- Certificate creates usage event.
- First 10,000 certificates are included.
- Certificate 10,001+ is reported as extra usage to Stripe.
- Dashboard shows usage meter.
- Billing portal opens correctly.
- Payment failure changes workspace to past_due.
- Canceled subscription blocks new certificate generation.
- Existing certificates remain accessible after cancellation.
- Webhook duplicate events do not break data.
```

---

## 23. Common Mistakes to Avoid

```txt
- Using prod_ ID instead of price_ ID in Checkout.
- Forgetting to add usage price as second line item.
- Unlocking dashboard before webhook confirms active subscription.
- Parsing webhook JSON before verifying Stripe signature.
- Not storing Stripe event IDs for idempotency.
- Reporting all certificates to Stripe instead of only extra usage.
- Storing raw API keys in Supabase.
- Using test Price IDs in production.
- Forgetting to add env vars in Vercel.
- Forgetting to redeploy Vercel after env changes.
- Blocking read access to old certificates after cancellation.
```

---

## 24. Recommended Environment Example

```env
NEXT_PUBLIC_APP_URL=https://sentinelum.cloud

SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_GROWTH_ANNUAL=
STRIPE_PRICE_CERTIFICATE_USAGE=
STRIPE_FREE_CERTIFICATES_INCLUDED=10000
STRIPE_CERTIFICATE_UNIT_PRICE_CENTS=5

API_KEY_HASH_SECRET=
CERTIFICATE_SIGNING_SECRET=
ENCRYPTION_KEY=
```

---

## 25. Summary

Sentinelum payment logic:

```txt
One annual subscription unlocks access.
One metered usage price charges only extra certificates.
Stripe webhook is source of truth for subscription status.
Supabase stores workspace, subscription state, usage and certificates.
Certificate generation is blocked unless subscription is active/trialing.
Usage is counted locally first, then extra usage is reported to Stripe.
```

Production webhook:

```txt
https://sentinelum.cloud/api/stripe/webhook
```

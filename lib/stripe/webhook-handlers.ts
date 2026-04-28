import Stripe from 'stripe';
import { env } from '@/lib/env';
import { sendPaymentFailedEmail } from '@/lib/email/resend';
import { createServiceClient } from '@/lib/supabase/service';

function unixToIso(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null;
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient();
  const workspaceId = session.metadata?.workspace_id;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

  if (!workspaceId) return;

  await supabase
    .from('workspaces')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan: 'growth',
      subscription_status: subscriptionId ? 'incomplete' : 'active',
      annual_certificate_allowance: env.STRIPE_FREE_CERTIFICATES_INCLUDED
    })
    .eq('id', workspaceId);
}

export async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const supabase = createServiceClient();
  const workspaceId = subscription.metadata?.workspace_id;
  const currentPeriodStart = unixToIso(subscription.current_period_start);
  const currentPeriodEnd = unixToIso(subscription.current_period_end);

  let query = supabase.from('workspaces').update({
    stripe_customer_id: String(subscription.customer),
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    plan: 'growth',
    annual_certificate_allowance: env.STRIPE_FREE_CERTIFICATES_INCLUDED,
    usage_period_start: currentPeriodStart,
    usage_period_end: currentPeriodEnd
  });

  if (workspaceId) query = query.eq('id', workspaceId);
  else query = query.eq('stripe_customer_id', String(subscription.customer));

  await query;
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createServiceClient();
  await supabase
    .from('workspaces')
    .update({ subscription_status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);
}

export async function upsertInvoice(invoice: Stripe.Invoice, status: 'active' | 'past_due') {
  const supabase = createServiceClient();
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, owner_user_id, profiles:owner_user_id(email)')
    .or(`stripe_customer_id.eq.${customerId},stripe_subscription_id.eq.${subscriptionId}`)
    .maybeSingle();

  if (!workspace) return;

  await supabase.from('invoices').upsert({
    workspace_id: workspace.id,
    stripe_invoice_id: invoice.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: invoice.status,
    amount_paid: invoice.amount_paid,
    amount_due: invoice.amount_due,
    currency: invoice.currency,
    hosted_invoice_url: invoice.hosted_invoice_url,
    invoice_pdf: invoice.invoice_pdf
  });

  await supabase
    .from('workspaces')
    .update({ subscription_status: status })
    .eq('id', workspace.id);

  if (status === 'past_due') {
    const profileRelation = (workspace as any).profiles;
    const ownerEmail = Array.isArray(profileRelation)
      ? profileRelation[0]?.email
      : profileRelation?.email;
    if (ownerEmail) await sendPaymentFailedEmail(ownerEmail, workspace.name);
  }
}

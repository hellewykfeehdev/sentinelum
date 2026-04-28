import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/env';
import { stripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/service';
import {
  handleCheckoutCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpsert,
  upsertInvoice
} from '@/lib/stripe/webhook-handlers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
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
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        await upsertInvoice(event.data.object as Stripe.Invoice, 'active');
        break;
      case 'invoice.payment_failed':
        await upsertInvoice(event.data.object as Stripe.Invoice, 'past_due');
        break;
      default:
        break;
    }

    await supabase.from('stripe_events').insert({
      id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

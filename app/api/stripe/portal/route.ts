import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getStripe } from '@/lib/stripe/client';
import { requireWorkspace } from '@/lib/workspaces';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const { workspace } = await requireWorkspace();
    if (!workspace.stripe_customer_id) {
      return NextResponse.json({ error: 'Stripe customer not found' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripe_customer_id,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to create billing portal session' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { assertBillingEnv, env, stripePriceAnnual, stripePriceUsage } from '@/lib/env';
import { stripe } from '@/lib/stripe/client';
import { createServiceClient } from '@/lib/supabase/service';
import { requireWorkspace } from '@/lib/workspaces';

export const runtime = 'nodejs';

export async function POST() {
  try {
    assertBillingEnv();
    const { user, workspace } = await requireWorkspace();
    const supabase = createServiceClient();

    let customerId = workspace.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: workspace.name,
        metadata: { user_id: user.id, workspace_id: workspace.id }
      });
      customerId = customer.id;
      await supabase.from('workspaces').update({ stripe_customer_id: customerId }).eq('id', workspace.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
      line_items: [
        { price: stripePriceAnnual!, quantity: 1 },
        { price: stripePriceUsage! }
      ],
      metadata: {
        user_id: user.id,
        workspace_id: workspace.id,
        plan: 'growth'
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          workspace_id: workspace.id,
          plan: 'growth'
        }
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const status =
      typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;

    if (status === 401) {
      return NextResponse.json(
        { error: 'Authentication required', login_url: '/login?next=/pricing' },
        { status: 401 }
      );
    }

    console.error(error);
    return NextResponse.json(
      {
        error:
          status === 503
            ? 'Database is not migrated. Run the Supabase migration before checkout.'
            : 'Unable to create checkout session'
      },
      { status }
    );
  }
}

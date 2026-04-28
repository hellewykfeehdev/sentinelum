import { NextResponse } from 'next/server';
import { requireWorkspace } from '@/lib/workspaces';

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    return NextResponse.json({
      subscription_status: workspace.subscription_status,
      plan: workspace.plan || 'free',
      stripe_customer_id: workspace.stripe_customer_id,
      stripe_subscription_id: workspace.stripe_subscription_id
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load billing status' }, { status: 500 });
  }
}

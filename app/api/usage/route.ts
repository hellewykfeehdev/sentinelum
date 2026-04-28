import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getCurrentPeriodUsage } from '@/lib/usage';
import { requireWorkspace } from '@/lib/workspaces';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const used = await getCurrentPeriodUsage(workspace);
    const included = workspace.annual_certificate_allowance || env.STRIPE_FREE_CERTIFICATES_INCLUDED;
    const extra = Math.max(used - included, 0);

    return NextResponse.json({
      included,
      used,
      remaining: Math.max(included - used, 0),
      extra,
      estimated_extra_cents: extra * env.STRIPE_CERTIFICATE_UNIT_PRICE_CENTS
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load usage' }, { status: 500 });
  }
}

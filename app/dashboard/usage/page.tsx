import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { env } from '@/lib/env';
import { formatNumber } from '@/lib/utils';
import { getCurrentPeriodUsage } from '@/lib/usage';
import { requireWorkspace } from '@/lib/workspaces';

export default async function UsagePage() {
  const { workspace } = await requireWorkspace();
  const used = await getCurrentPeriodUsage(workspace);
  const included = workspace.annual_certificate_allowance || env.STRIPE_FREE_CERTIFICATES_INCLUDED;
  const remaining = Math.max(included - used, 0);
  const extra = Math.max(used - included, 0);
  const pct = Math.min(100, Math.round((used / included) * 100));

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold">Usage</h1>
      <p className="mt-2 text-slate-400">Certificate usage is counted by billing period and only extra usage is reported to Stripe.</p>
      <Card className="mt-8">
        <CardTitle>{formatNumber(used)} / {formatNumber(included)} included certificates used</CardTitle>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-cyan-300" style={{ width: `${pct}%` }} /></div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <UsageStat label="Remaining included" value={formatNumber(remaining)} />
          <UsageStat label="Extra certificates" value={formatNumber(extra)} />
          <UsageStat label="Estimated extra charge" value={`$${((extra * env.STRIPE_CERTIFICATE_UNIT_PRICE_CENTS) / 100).toFixed(2)}`} />
        </div>
        <CardDescription className="mt-6">Current period: {workspace.usage_period_start || 'pending'} to {workspace.usage_period_end || 'pending'}.</CardDescription>
      </Card>
    </div>
  );
}

function UsageStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-white/10 bg-white/6 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 font-display text-2xl">{value}</p></div>;
}

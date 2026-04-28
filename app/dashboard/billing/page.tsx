import Link from 'next/link';
import { PortalButton } from '@/components/portal-button';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/service';
import { formatDate } from '@/lib/utils';
import { requireWorkspace } from '@/lib/workspaces';

export default async function BillingPage() {
  const { workspace } = await requireWorkspace();
  const supabase = createServiceClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(8);

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold">Billing</h1>
      <p className="mt-2 text-slate-400">Stripe is the source of truth for subscription access.</p>
      <Card className="mt-8">
        <CardTitle>Subscription status: {workspace.subscription_status || 'incomplete'}</CardTitle>
        <CardDescription>Plan: {workspace.plan || 'free'}. Existing certificates remain accessible after cancellation.</CardDescription>
        <div className="mt-6 flex gap-3">
          {workspace.stripe_customer_id ? <PortalButton /> : <Link href="/pricing"><Button>Activate plan</Button></Link>}
        </div>
      </Card>
      <Card className="mt-6">
        <CardTitle>Invoices</CardTitle>
        <div className="mt-5 divide-y divide-white/10">
          {(invoices || []).map((invoice) => (
            <div key={invoice.id} className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_120px_140px_120px]">
              <span className="font-mono text-cyan-100">{invoice.stripe_invoice_id}</span>
              <span>{invoice.status}</span>
              <span>${((invoice.amount_paid || 0) / 100).toFixed(2)}</span>
              <span className="text-slate-500">{formatDate(invoice.created_at)}</span>
            </div>
          ))}
          {!invoices?.length && <CardDescription>No invoices synced yet.</CardDescription>}
        </div>
      </Card>
    </div>
  );
}

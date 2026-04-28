import Link from 'next/link';
import { AlertCircle, CheckCircle2, FileCheck2, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/service';
import { formatDate, formatNumber } from '@/lib/utils';
import { getCurrentPeriodUsage } from '@/lib/usage';
import { requireWorkspace } from '@/lib/workspaces';

export default async function DashboardPage() {
  const { workspace } = await requireWorkspace();
  const supabase = createServiceClient();
  const [certificates, apiKeys, usage] = await Promise.all([
    supabase.from('certificates').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('api_keys').select('id').eq('workspace_id', workspace.id).is('revoked_at', null),
    getCurrentPeriodUsage(workspace)
  ]);
  const certs = certificates.data || [];
  const active = ['active', 'trialing'].includes(workspace.subscription_status || 'incomplete');
  const allowance = workspace.annual_certificate_allowance || 10000;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Badge>{active ? 'Workspace active' : 'Payment required'}</Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold">Oversight command center</h1>
          <p className="mt-2 text-slate-400">{workspace.name}</p>
        </div>
        {!active && <Link href="/pricing"><Button>Activate with Stripe</Button></Link>}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total certificates" value={formatNumber(certs.length)} icon={<FileCheck2 />} />
        <Metric label="Used this period" value={`${formatNumber(usage)} / ${formatNumber(allowance)}`} icon={<CheckCircle2 />} />
        <Metric label="Active API keys" value={formatNumber(apiKeys.data?.length || 0)} icon={<KeyRound />} />
        <Metric label="Subscription" value={workspace.subscription_status || 'incomplete'} icon={<AlertCircle />} />
      </div>

      <Card className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Recent certificates</CardTitle>
          <Link href="/dashboard/certificates"><Button variant="secondary" size="sm">View all</Button></Link>
        </div>
        <div className="mt-5 divide-y divide-white/10">
          {certs.map((cert) => (
            <Link key={cert.id} href={`/dashboard/certificates/${cert.id}`} className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_140px_180px]">
              <span className="font-mono text-cyan-100">{cert.certificate_number}</span>
              <span className="capitalize text-slate-300">{cert.decision}</span>
              <span className="text-slate-500">{formatDate(cert.created_at)}</span>
            </Link>
          ))}
          {!certs.length && <CardDescription>No certificates yet. Create an API key and send your first request.</CardDescription>}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-200">{icon}</div>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </Card>
  );
}

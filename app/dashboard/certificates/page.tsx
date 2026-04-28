import Link from 'next/link';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/service';
import { formatDate } from '@/lib/utils';
import { requireWorkspace } from '@/lib/workspaces';

export default async function CertificatesPage() {
  const { workspace } = await requireWorkspace();
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold">Certificates</h1>
      <p className="mt-2 text-slate-400">Searchable, immutable oversight records for your workspace.</p>
      <Card className="mt-8 overflow-hidden p-0">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-3 border-b border-white/10 p-4 text-xs uppercase text-slate-500">
          <span>Certificate</span><span>Decision</span><span>AI System</span><span>Issued</span>
        </div>
        {(data || []).map((cert) => (
          <Link key={cert.id} href={`/dashboard/certificates/${cert.id}`} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-3 border-b border-white/6 p-4 text-sm hover:bg-white/5">
            <span className="font-mono text-cyan-100">{cert.certificate_number}</span>
            <span className="capitalize text-slate-300">{cert.decision}</span>
            <span className="text-slate-300">{cert.ai_system_name}</span>
            <span className="text-slate-500">{formatDate(cert.issued_at || cert.created_at)}</span>
          </Link>
        ))}
        {!data?.length && <div className="p-6"><CardTitle>No certificates yet</CardTitle><CardDescription>Your API-created certificates will appear here.</CardDescription></div>}
      </Card>
    </div>
  );
}

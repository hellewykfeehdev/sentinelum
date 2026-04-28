import Link from 'next/link';
import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/service';
import { formatDate } from '@/lib/utils';
import { requireWorkspace } from '@/lib/workspaces';

export default async function CertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const supabase = createServiceClient();
  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle();

  if (!cert) return <Card><CardTitle>Certificate not found</CardTitle></Card>;

  return (
    <div>
      <p className="text-sm text-cyan-200">Certificate detail</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">{cert.certificate_number}</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={cert.pdf_url || `/api/v1/certificates/${cert.id}/pdf`} target="_blank"><Button><Download className="h-4 w-4" />Download PDF</Button></a>
        <Link href={`/verify/${cert.id}`} target="_blank"><Button variant="secondary"><ExternalLink className="h-4 w-4" />Public verification</Button></Link>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Decision</CardTitle>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>Status: <span className="text-white">{cert.status}</span></p>
            <p>Decision: <span className="capitalize text-white">{cert.decision}</span></p>
            <p>Reviewer: <span className="text-white">{cert.human_reviewer_name}</span> ({cert.human_reviewer_role})</p>
            <p>Issued: <span className="text-white">{formatDate(cert.issued_at || cert.created_at)}</span></p>
          </div>
        </Card>
        <Card>
          <CardTitle>AI context</CardTitle>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>System: <span className="text-white">{cert.ai_system_name}</span></p>
            <p>Model: <span className="text-white">{cert.model_name}</span></p>
            <p>Risk flags: <span className="text-white">{(cert.risk_flags || []).join(', ') || 'None'}</span></p>
          </div>
        </Card>
      </div>
      <Card className="mt-4">
        <CardTitle>Hashes and signature</CardTitle>
        <CardDescription>These values are generated from the normalized payload and server-side HMAC signing secret.</CardDescription>
        <div className="mt-5 space-y-4 font-mono text-xs text-slate-300">
          {[
            ['AI output hash', cert.ai_output_hash],
            ['Payload hash', cert.payload_hash],
            ['Certificate hash', cert.certificate_hash],
            ['Signature', cert.signature],
            ['Verification URL', cert.verification_url]
          ].map(([label, value]) => (
            <div key={label}><p className="mb-1 font-sans text-xs uppercase text-slate-500">{label}</p><p className="overflow-x-auto rounded bg-black/35 p-3">{value}</p></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

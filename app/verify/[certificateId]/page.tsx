import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/service';
import { formatDate } from '@/lib/utils';

export default async function VerifyPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  const supabase = createServiceClient();
  const { data: cert } = await supabase
    .from('certificates')
    .select('*, workspaces(name)')
    .eq('id', certificateId)
    .maybeSingle();

  const valid = cert?.status === 'issued';

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-cyan-200">Sentinelum</Link>
      <Card className="mt-12">
        <div className="flex items-start gap-4">
          {valid ? <CheckCircle2 className="h-9 w-9 text-emerald-300" /> : <XCircle className="h-9 w-9 text-orange-300" />}
          <div>
            <CardTitle className="text-3xl">{valid ? 'Certificate verified' : 'Certificate not found'}</CardTitle>
            <CardDescription>{valid ? 'This certificate exists in Sentinelum and is marked as issued.' : 'No issued certificate was found for this identifier.'}</CardDescription>
          </div>
        </div>
        {cert && (
          <div className="mt-8 grid gap-4 text-sm text-slate-300">
            <Row label="Certificate number" value={cert.certificate_number} />
            <Row label="Workspace" value={cert.workspaces?.name || 'Sentinelum workspace'} />
            <Row label="AI system" value={`${cert.ai_system_name} (${cert.model_name})`} />
            <Row label="Human reviewer" value={`${cert.human_reviewer_name}, ${cert.human_reviewer_role}`} />
            <Row label="Decision" value={cert.decision} />
            <Row label="Issued UTC" value={formatDate(cert.issued_at || cert.created_at)} />
            <Row label="Payload hash" value={cert.payload_hash} mono />
            <Row label="Certificate hash" value={cert.certificate_hash} mono />
            <Row label="Signature" value={cert.signature} mono />
            {cert.pdf_url && <a href={cert.pdf_url} target="_blank"><Button className="mt-3">Open certificate PDF</Button></a>}
          </div>
        )}
      </Card>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={mono ? 'mt-1 overflow-x-auto rounded bg-black/35 p-3 font-mono text-xs text-cyan-50' : 'mt-1 text-white'}>{value}</p>
    </div>
  );
}

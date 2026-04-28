import { NextRequest, NextResponse } from 'next/server';
import { generateCertificatePdf } from '@/lib/certificates/pdf';
import { createServiceClient } from '@/lib/supabase/service';
import { absoluteUrl } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = createServiceClient();
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*, workspaces(name)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!certificate) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });

    const buffer = await generateCertificatePdf({
      id: certificate.id,
      certificate_number: certificate.certificate_number,
      workspace_name: certificate.workspaces?.name || 'Sentinelum workspace',
      ai_system_name: certificate.ai_system_name,
      model_name: certificate.model_name,
      ai_output_hash: certificate.ai_output_hash,
      human_reviewer_name: certificate.human_reviewer_name,
      human_reviewer_email: certificate.human_reviewer_email,
      human_reviewer_role: certificate.human_reviewer_role,
      decision: certificate.decision,
      decision_notes: certificate.decision_notes,
      risk_flags: certificate.risk_flags || [],
      issued_at: certificate.issued_at || certificate.created_at,
      payload_hash: certificate.payload_hash,
      certificate_hash: certificate.certificate_hash,
      signature: certificate.signature,
      verification_url: certificate.verification_url || absoluteUrl(`/verify/${certificate.id}`)
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${certificate.certificate_number}.pdf"`
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to generate PDF' }, { status: 500 });
  }
}

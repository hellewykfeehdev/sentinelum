import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, context: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await context.params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('certificates')
    .select('id, certificate_number, status, ai_system_name, model_name, ai_output_hash, human_reviewer_name, human_reviewer_role, decision, risk_flags, payload_hash, certificate_hash, signature, issued_at, verification_url, pdf_url, workspaces(name)')
    .eq('id', certificateId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Unable to verify certificate' }, { status: 500 });
  if (!data) return NextResponse.json({ valid: false }, { status: 404 });

  return NextResponse.json({ valid: data.status === 'issued', certificate: data });
}

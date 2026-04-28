import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { certificateCreateSchema } from '@/lib/certificates/schema';
import { createCertificate, resolveWorkspaceFromApiKey } from '@/lib/certificates/service';
import { rateLimit } from '@/lib/rate-limit';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });

    const limited = await rateLimit(token.slice(0, 18), 120);
    if (!limited.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const workspace = await resolveWorkspaceFromApiKey(token);
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

    const payload = certificateCreateSchema.parse(await req.json());
    const certificate = await createCertificate({ workspace, payload });

    return NextResponse.json(
      {
        id: certificate.id,
        certificate_number: certificate.certificate_number,
        status: certificate.status,
        certificate_hash: certificate.certificate_hash,
        verification_url: certificate.verification_url,
        pdf_url: certificate.pdf_url
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    console.error(error);
    return NextResponse.json({ error: status === 402 ? 'Subscription required' : 'Unable to create certificate' }, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });

    const workspace = await resolveWorkspaceFromApiKey(token);
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ certificates: data });
  } catch {
    return NextResponse.json({ error: 'Unable to load certificates' }, { status: 500 });
  }
}

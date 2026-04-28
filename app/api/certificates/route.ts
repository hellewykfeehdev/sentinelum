import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { certificateCreateSchema } from '@/lib/certificates/schema';
import { createCertificate } from '@/lib/certificates/service';
import { createServiceClient } from '@/lib/supabase/service';
import { requireWorkspace } from '@/lib/workspaces';

export const runtime = 'nodejs';

export async function GET() {
  const { workspace } = await requireWorkspace();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Unable to load certificates' }, { status: 500 });
  return NextResponse.json({ certificates: data });
}

export async function POST(req: NextRequest) {
  try {
    const { user, workspace } = await requireWorkspace();
    const payload = certificateCreateSchema.parse(await req.json());
    const certificate = await createCertificate({ workspace, payload, actorId: user.id });
    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unable to create certificate' }, { status: 500 });
  }
}

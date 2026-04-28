import { NextRequest, NextResponse } from 'next/server';
import { resolveWorkspaceFromApiKey } from '@/lib/certificates/service';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authorization = req.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 });

    const workspace = await resolveWorkspaceFromApiKey(token);
    if (!workspace) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    return NextResponse.json({ certificate: data });
  } catch {
    return NextResponse.json({ error: 'Unable to load certificate' }, { status: 500 });
  }
}

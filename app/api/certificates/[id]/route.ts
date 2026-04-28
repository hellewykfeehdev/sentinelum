import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireWorkspace } from '@/lib/workspaces';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { workspace } = await requireWorkspace();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Unable to load certificate' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  return NextResponse.json({ certificate: data });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { requireWorkspace } from '@/lib/workspaces';

export const runtime = 'nodejs';

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { user, workspace } = await requireWorkspace();
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', workspace.id);

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      workspace_id: workspace.id,
      actor_id: user.id,
      action: 'api_key.revoked',
      target_type: 'api_key',
      target_id: id,
      metadata: {}
    });

    return NextResponse.json({ revoked: true });
  } catch {
    return NextResponse.json({ error: 'Unable to revoke API key' }, { status: 500 });
  }
}

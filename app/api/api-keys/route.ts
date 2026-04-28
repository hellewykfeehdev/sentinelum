import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiKey, hashApiKey } from '@/lib/security/crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { requireWorkspace } from '@/lib/workspaces';

const createApiKeySchema = z.object({
  name: z.string().min(2).max(80),
  mode: z.enum(['live', 'test']).default('live')
});

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ api_keys: data });
  } catch {
    return NextResponse.json({ error: 'Unable to load API keys' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, workspace } = await requireWorkspace();
    if (!['active', 'trialing'].includes(workspace.subscription_status || 'incomplete')) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 });
    }

    const body = createApiKeySchema.parse(await req.json());
    const rawKey = createApiKey(body.mode);
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        workspace_id: workspace.id,
        name: body.name,
        key_prefix: rawKey.slice(0, 14),
        key_hash: hashApiKey(rawKey)
      })
      .select('id, name, key_prefix, created_at')
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert({
      workspace_id: workspace.id,
      actor_id: user.id,
      action: 'api_key.created',
      target_type: 'api_key',
      target_id: data.id,
      metadata: { name: body.name }
    });

    return NextResponse.json({ api_key: data, secret: rawKey }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.flatten() }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Unable to create API key' }, { status: 500 });
  }
}

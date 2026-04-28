import { env } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

export class DatabaseSetupError extends Error {
  status = 503;

  constructor(message = 'Supabase schema has not been migrated yet') {
    super(message);
    this.name = 'DatabaseSetupError';
  }
}

function isSchemaMissing(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ['PGRST204', 'PGRST205', '22P02'].includes(String((error as { code?: string }).code))
  );
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getUserWorkspace(userId: string) {
  const supabase = createServiceClient();

  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isSchemaMissing(error)) throw new DatabaseSetupError();
    throw error;
  }
  return member?.workspaces || null;
}

export async function ensureProfileAndWorkspace(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  const fullName = String(user.user_metadata?.full_name || user.user_metadata?.name || '').trim();

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email || '',
    full_name: fullName || null
  });
  if (profileError) {
    if (isSchemaMissing(profileError)) throw new DatabaseSetupError();
    throw profileError;
  }

  const existing = await getUserWorkspace(user.id);
  if (existing) return existing;

  const workspaceName =
    fullName ? `${fullName.split(' ')[0]}'s Workspace` : `${user.email?.split('@')[0] || 'Sentinelum'} Workspace`;

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({
      name: workspaceName,
      owner_user_id: user.id,
      plan: 'free',
      subscription_status: 'incomplete',
      annual_certificate_allowance: env.STRIPE_FREE_CERTIFICATES_INCLUDED
    })
    .select('*')
    .single();

  if (error) {
    if (isSchemaMissing(error)) throw new DatabaseSetupError();
    throw error;
  }

  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: 'owner'
  });

  await supabase.from('audit_logs').insert({
    workspace_id: workspace.id,
    actor_id: user.id,
    action: 'workspace.created',
    target_type: 'workspace',
    target_id: workspace.id,
    metadata: {}
  });

  return workspace;
}

export async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
  const workspace = await ensureProfileAndWorkspace(user);
  return { user, workspace };
}

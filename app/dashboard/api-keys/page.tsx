import { CreateApiKeyForm } from '@/components/create-api-key-form';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { createServiceClient } from '@/lib/supabase/service';
import { formatDate } from '@/lib/utils';
import { requireWorkspace } from '@/lib/workspaces';

export default async function ApiKeysPage() {
  const { workspace } = await requireWorkspace();
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold">API keys</h1>
      <p className="mt-2 text-slate-400">Create live keys after payment is active. Raw keys are shown once only.</p>
      <div className="mt-8"><CreateApiKeyForm /></div>
      <Card className="mt-6">
        <CardTitle>Existing keys</CardTitle>
        <div className="mt-5 divide-y divide-white/10">
          {(data || []).map((key) => (
            <div key={key.id} className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_160px_180px_100px]">
              <span className="text-white">{key.name}</span>
              <span className="font-mono text-cyan-100">{key.key_prefix}...</span>
              <span className="text-slate-500">{formatDate(key.last_used_at || key.created_at)}</span>
              <span className={key.revoked_at ? 'text-orange-300' : 'text-emerald-300'}>{key.revoked_at ? 'revoked' : 'active'}</span>
            </div>
          ))}
          {!data?.length && <CardDescription>No keys created yet.</CardDescription>}
        </div>
      </Card>
    </div>
  );
}

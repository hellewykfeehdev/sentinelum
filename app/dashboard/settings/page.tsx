import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { requireWorkspace } from '@/lib/workspaces';

export default async function SettingsPage() {
  const { workspace } = await requireWorkspace();
  return (
    <div>
      <h1 className="font-display text-4xl font-semibold">Settings</h1>
      <Card className="mt-8">
        <CardTitle>{workspace.name}</CardTitle>
        <CardDescription>Workspace settings are intentionally conservative in this first production build. Certificates remain append-only and cannot be edited after issue.</CardDescription>
        <div className="mt-5 grid gap-3 text-sm text-slate-300">
          <p>Workspace ID: <span className="font-mono text-cyan-100">{workspace.id}</span></p>
          <p>Subscription: <span className="text-white">{workspace.subscription_status || 'incomplete'}</span></p>
        </div>
      </Card>
    </div>
  );
}

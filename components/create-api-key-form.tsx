'use client';

import { FormEvent, useState } from 'react';
import { Copy, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CreateApiKeyForm() {
  const [name, setName] = useState('Production key');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mode: 'live' })
    });
    const data = await res.json();
    if (data.secret) setSecret(data.secret);
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/6 p-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Key name" />
        <Button disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create API key</Button>
      </form>
      {secret && (
        <div className="mt-5 rounded-md border border-cyan-300/20 bg-cyan-300/8 p-4">
          <p className="text-sm font-semibold text-cyan-100">Copy this key now. Sentinelum will not show it again.</p>
          <div className="mt-3 flex gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded bg-black/40 p-3 text-xs text-cyan-50">{secret}</code>
            <Button type="button" variant="secondary" size="icon" onClick={() => navigator.clipboard.writeText(secret)} aria-label="Copy API key"><Copy className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;

    const result =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName }, emailRedirectTo: redirectTo }
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    const nextPath =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next')
        : null;
    router.push(nextPath || '/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'signup' && (
        <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" required />
      )}
      <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="work@email.com" required />
      <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" minLength={8} required />
      {error && <p className="rounded-md border border-orange-400/30 bg-orange-400/10 p-3 text-sm text-orange-100">{error}</p>}
      <Button className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  );
}

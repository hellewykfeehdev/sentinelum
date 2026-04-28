import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { AuthForm } from '@/components/auth-form';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <ShieldCheck className="h-8 w-8 text-cyan-200" />
        <CardTitle className="mt-5 text-2xl">Sign in to Sentinelum</CardTitle>
        <CardDescription>Access certificates, API keys, billing and usage controls.</CardDescription>
        <div className="mt-6"><AuthForm mode="login" /></div>
        <p className="mt-5 text-sm text-slate-400">No account yet? <Link className="text-cyan-200" href="/signup">Create one</Link></p>
      </Card>
    </main>
  );
}

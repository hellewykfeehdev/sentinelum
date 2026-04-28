import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { AuthForm } from '@/components/auth-form';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <ShieldCheck className="h-8 w-8 text-cyan-200" />
        <CardTitle className="mt-5 text-2xl">Create your Sentinelum account</CardTitle>
        <CardDescription>Start with checkout, then create API keys once Stripe activates your workspace.</CardDescription>
        <div className="mt-6"><AuthForm mode="signup" /></div>
        <p className="mt-5 text-sm text-slate-400">Already have an account? <Link className="text-cyan-200" href="/login">Sign in</Link></p>
      </Card>
    </main>
  );
}

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { CheckoutButton } from '@/components/checkout-button';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-cyan-200">Sentinelum</Link>
      <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Pricing</p>
          <h1 className="mt-5 font-display text-5xl font-semibold">One annual plan for serious AI oversight.</h1>
          <p className="mt-5 text-slate-300">Unlock dashboards, certificate generation, API keys, audit logs, PDF storage and public verification.</p>
        </div>
        <Card className="p-8">
          <CardTitle className="text-3xl">Sentinelum Growth</CardTitle>
          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-5xl font-semibold text-white">$999</span>
            <span className="pb-2 text-slate-400">/ year</span>
          </div>
          <CardDescription className="mt-4">
            Includes 10,000 certificates per year. Extra certificates are billed at $0.05 each after quota.
          </CardDescription>
          <div className="mt-8 space-y-3">
            {['Annual platform access', 'Cryptographic certificates', 'API key management', 'Usage dashboard', 'Stripe billing portal', 'Public verification pages'].map((item) => (
              <p key={item} className="flex items-center gap-3 text-sm text-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{item}</p>
            ))}
          </div>
          <div className="mt-8"><CheckoutButton /></div>
          <Link href="/api-docs"><Button variant="ghost" className="mt-3 w-full">Read API docs</Button></Link>
        </Card>
      </div>
    </main>
  );
}

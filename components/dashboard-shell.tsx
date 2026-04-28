import Link from 'next/link';
import { BarChart3, CreditCard, FileCheck2, Gauge, KeyRound, LayoutDashboard, Settings, ShieldCheck } from 'lucide-react';

const nav = [
  ['/dashboard', LayoutDashboard, 'Overview'],
  ['/dashboard/certificates', FileCheck2, 'Certificates'],
  ['/dashboard/api-keys', KeyRound, 'API keys'],
  ['/dashboard/usage', Gauge, 'Usage'],
  ['/dashboard/billing', CreditCard, 'Billing'],
  ['/dashboard/settings', Settings, 'Settings']
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-white/10 bg-black/20 p-4 lg:min-h-screen lg:border-b-0 lg:border-r">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-cyan-300/25 bg-cyan-300/10">
            <ShieldCheck className="h-5 w-5 text-cyan-200" />
          </span>
          <span className="font-display text-lg font-semibold">Sentinelum</span>
        </Link>
        <nav className="mt-8 grid gap-1">
          {nav.map(([href, Icon, label]) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white">
              <Icon className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        <Link href="/api-docs" className="mt-8 flex items-center gap-3 rounded-md border border-white/10 bg-white/6 px-3 py-3 text-sm text-slate-300">
          <BarChart3 className="h-4 w-4 text-cyan-200" />API documentation
        </Link>
      </aside>
      <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Binary,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileCheck2,
  Fingerprint,
  Gauge,
  HeartPulse,
  Landmark,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Sparkles,
  Workflow,
  type LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { CheckoutButton } from '@/components/checkout-button';
import { FrameSequence } from '@/components/frame-sequence';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 }
};

const useCases = [
  ['Fintech', Landmark, 'AI recommends credit limits, fraud actions or account reviews. Sentinelum records reviewer identity, decision context and cryptographic proof before action.'],
  ['Insurance', ShieldCheck, 'Claims recommendations need a defensible review trail. Turn each human override or approval into a signed certificate.'],
  ['Legal AI', Scale, 'When AI drafts analysis or flags risk, Sentinelum proves which professional reviewed the output and what changed.'],
  ['Healthcare', HeartPulse, 'Capture oversight around non-diagnostic triage, coding and administrative AI workflows without storing raw sensitive data by default.'],
  ['HR & Recruiting', Building2, 'Document human review for screening, escalation and candidate-impacting automation before decisions become disputes.'],
  ['Support AI', ClipboardCheck, 'Record when an agent approved, modified or rejected AI-generated customer responses in sensitive cases.'],
  ['AI Agencies', Workflow, 'Add an audit-ready trust layer to automations delivered to regulated clients.']
] as const;

const productSteps: Array<[string, LucideIcon, string]> = [
  ['AI Output Generated', Binary, 'Capture the system, model and decision context.'],
  ['Human Review Captured', BadgeCheck, 'Record reviewer identity, role, notes and final decision.'],
  ['Cryptographic Stamp Created', Fingerprint, 'Normalize the payload, hash it and sign it server-side.'],
  ['Certificate Issued', FileCheck2, 'Generate a PDF and public verification URL.']
];

const faqs = [
  ['Is Sentinelum an AI model?', 'No. Sentinelum is an oversight proof layer for AI systems.'],
  ['Do we need to replace our existing AI stack?', 'No. Sentinelum works through API calls and can be added to existing workflows.'],
  ['Do you store our AI outputs?', 'By default, Sentinelum stores hashes and certificate metadata. Teams should avoid sending sensitive raw data unless required.'],
  ['Is this legal advice?', 'No. Sentinelum provides technical evidence and audit trails, not legal advice.'],
  ['Can certificates be verified publicly?', 'Yes. Each certificate can have a verification URL with the certificate status and hashes.']
] as const;

export default function LandingPage() {
  const [issued, setIssued] = useState(false);
  const hash = useMemo(() => (issued ? '9f41c2a8b77e2d18f0a1c4b3d7e91c02...' : 'Awaiting review stamp'), [issued]);

  return (
    <main className="relative overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070d]/78 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md border border-cyan-300/25 bg-cyan-300/10">
              <ShieldCheck className="h-5 w-5 text-cyan-200" />
            </span>
            <span className="font-display text-lg font-semibold">Sentinelum</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#product" className="hover:text-white">Product</a>
            <a href="#api" className="hover:text-white">API</a>
            <a href="#use-cases" className="hover:text-white">Use Cases</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden text-sm text-slate-300 hover:text-white sm:inline">Sign in</Link>
            <Link href="/signup">
              <Button size="sm">Start protecting AI decisions</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }} className="relative z-10">
          <motion.div variants={fadeUp}>
            <Badge>Human control layer for AI decisions</Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="mt-7 max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            AI is making decisions. Sentinelum proves who stayed in control.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Generate cryptographic evidence of human oversight for every critical AI decision with timestamps, reviewer identity, immutable hashes, signed PDFs and audit-ready API logs.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup"><Button size="lg"><ArrowRight className="h-4 w-4" />Start protecting AI decisions</Button></Link>
            <a href="#api"><Button size="lg" variant="secondary"><Code2 className="h-4 w-4" />View API example</Button></a>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            {['Cryptographic hashes', 'Human reviewer identity', 'Signed certificates', 'Audit-ready logs'].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-300">{item}</span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-cyan-300/10 blur-3xl" />
          <div className="glass relative overflow-hidden rounded-lg p-2 shadow-glow">
            <div className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-cyan-300/14 to-transparent" />
            <FrameSequence />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(5,7,13,0.42)),linear-gradient(180deg,transparent,rgba(5,7,13,0.38))]" />
            <div className="pointer-events-none absolute inset-x-6 bottom-5 z-10 flex items-center justify-between rounded-md border border-white/10 bg-black/38 px-4 py-3 backdrop-blur-xl">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100">Oversight certificate</p>
                <p className="mt-1 text-sm text-slate-300">Issued, signed and ready for verification</p>
              </div>
              <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-white/10 sm:block">
                <div className="h-full w-2/3 animate-pulseLine bg-cyan-300" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <Section id="product" eyebrow="The audit gap">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-semibold sm:text-5xl">Your AI may explain what it recommended. But can you prove who reviewed it?</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {['AI decisions are hard to defend after the fact.', 'Human review is often undocumented or scattered across tools.', 'Regulators, insurers and enterprise buyers increasingly expect evidence.'].map((text) => (
            <Card key={text}><FileCheck2 className="h-5 w-5 text-cyan-200" /><CardDescription className="text-base text-slate-200">{text}</CardDescription></Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="How it works">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h2 className="max-w-2xl font-display text-3xl font-semibold sm:text-5xl">Sentinelum turns every reviewed AI output into a signed oversight certificate.</h2>
          <p className="max-w-md text-slate-400">Four steps, one defensible record. Designed for teams shipping AI into regulated, sensitive or high-risk workflows.</p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {productSteps.map(([title, Icon, text], index) => (
            <Card key={String(title)} className="relative">
              <Icon className="h-6 w-6 text-cyan-200" />
              <CardTitle className="mt-5">{title}</CardTitle>
              <CardDescription>{text}</CardDescription>
              {index < 3 && <div className="absolute -right-5 top-1/2 hidden h-px w-10 bg-cyan-300/40 lg:block" />}
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Live simulation">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardTitle>Interactive certificate simulation</CardTitle>
            <div className="mt-6 space-y-4 text-sm">
              <Field label="AI System" value="Credit Copilot" />
              <Field label="Model" value="gpt-5.5" />
              <Field label="AI Output" value="Approve customer claim with medium risk." />
              <Field label="Reviewer" value="Sarah Mitchell, Risk Analyst" />
              <Field label="Decision" value="Modified before approval" />
              <Field label="Risk Flags" value="financial_decision, customer_impact" />
            </div>
            <Button className="mt-6" onClick={() => setIssued(true)}>
              <Sparkles className="h-4 w-4" />Generate sample certificate
            </Button>
          </Card>
          <Card className={cn('overflow-hidden', issued && 'border-cyan-300/40')}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Certificate status</p>
                <CardTitle className="mt-1">{issued ? 'Certificate issued' : 'Ready for oversight stamp'}</CardTitle>
              </div>
              <CheckCircle2 className={cn('h-8 w-8', issued ? 'text-emerald-300' : 'text-slate-600')} />
            </div>
            <div className="mt-8 rounded-md border border-white/10 bg-black/30 p-5 font-mono text-xs text-slate-300">
              <p>certificate_number: {issued ? 'SEN-2026-000001' : 'pending'}</p>
              <p className="mt-3">certificate_hash: {hash}</p>
              <p className="mt-3">verification_url: https://sentinelum.cloud/verify/cert_xxx</p>
            </div>
          </Card>
        </div>
      </Section>

      <Section id="api" eyebrow="API-first">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-5xl">Add human oversight proof in one API call.</h2>
            <p className="mt-5 max-w-lg text-slate-400">Keep your stack. Add Sentinelum at the moment an AI output becomes a business decision.</p>
          </div>
          <CodeBlock />
        </div>
      </Section>

      <Section eyebrow="Dashboard preview">
        <div className="glass rounded-lg p-4">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {[
              ['Total Certificates', '18,420'],
              ['Human Approvals', '12,901'],
              ['Modified Decisions', '3,204'],
              ['Rejected Outputs', '742'],
              ['Avg Review Time', '2m 14s'],
              ['Risk Flags', '1,582']
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-white/10 bg-white/6 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-md border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-slate-400">Certificates over time</p>
              <div className="mt-6 flex h-44 items-end gap-2">
                {[30, 48, 42, 68, 76, 58, 92, 88, 110, 126, 118, 142].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-cyan-300" style={{ height: `${h}px` }} />
                ))}
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-slate-400">Usage meter</p>
              <p className="mt-5 font-display text-3xl">8,230 / 10,000</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[82%] bg-cyan-300" /></div>
              <p className="mt-4 text-sm text-slate-400">1,770 included certificates remaining.</p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="use-cases" eyebrow="Use cases">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map(([title, Icon, text]) => (
            <Card key={title}>
              <Icon className="h-6 w-6 text-cyan-200" />
              <CardTitle className="mt-5">{title}</CardTitle>
              <CardDescription>{text}</CardDescription>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="pricing" eyebrow="Launch plan">
        <div className="glass mx-auto max-w-3xl rounded-lg p-8 text-center">
          <Gauge className="mx-auto h-8 w-8 text-cyan-200" />
          <h2 className="mt-5 font-display text-4xl font-semibold">Sentinelum Annual</h2>
          <div className="mt-6 flex items-end justify-center gap-3">
            <span className="font-display text-6xl font-semibold text-white">$999</span>
            <span className="pb-3 text-slate-400">/ year</span>
          </div>
          <p className="mt-4 text-slate-300">
            One annual plan. All core features unlocked. 10,000 certificates included, then $0.05 per extra certificate.
          </p>
          <div className="mt-8 flex justify-center"><CheckoutButton fallbackHref="/login?next=/pricing" /></div>
          <p className="mt-4 text-sm text-slate-500">Built for teams shipping AI into regulated, sensitive or high-risk workflows.</p>
        </div>
      </Section>

      <Section id="faq" eyebrow="FAQ">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map(([question, answer]) => (
            <Card key={question} className="p-5">
              <CardTitle className="text-base">{question}</CardTitle>
              <CardDescription>{answer}</CardDescription>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-4xl text-center">
          <LockKeyhole className="mx-auto h-9 w-9 text-cyan-200" />
          <h2 className="mt-6 font-display text-4xl font-semibold sm:text-6xl">Start with one AI workflow. Prove every critical decision after that.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-slate-300">Create signed, timestamped evidence of human oversight before AI decisions become business risk.</p>
          <div className="mt-8"><Link href="/signup"><Button size="lg">Start protecting AI decisions</Button></Link></div>
        </div>
      </Section>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 text-sm text-slate-400 md:flex-row">
          <p>Sentinelum creates cryptographic evidence of human oversight for critical AI decisions.</p>
          <div className="flex flex-wrap gap-5">
            {['Product', 'API Docs', 'Pricing', 'Security', 'Contact', 'Terms', 'Privacy'].map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
      </footer>
    </main>
  );
}

function Section({ id, eyebrow, children }: { id?: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {eyebrow && <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">{eyebrow}</p>}
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="rounded-md border border-white/10 bg-white/6 px-3 py-2 text-slate-200">{value}</span>
    </div>
  );
}

function CodeBlock() {
  return (
    <div className="grid gap-4">
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/45 p-5 font-mono text-xs leading-6 text-slate-300">
{`await sentinelum.certificates.create({
  ai_system_name: "Credit Copilot",
  model_name: "gpt-5.5",
  ai_output,
  human_reviewer: {
    name: "Sarah Mitchell",
    email: "sarah@company.com",
    role: "Risk Analyst"
  },
  decision: "approved",
  risk_flags: ["financial_decision"]
});`}
      </pre>
      <pre className="overflow-x-auto rounded-lg border border-cyan-300/20 bg-cyan-300/8 p-5 font-mono text-xs leading-6 text-cyan-50">
{`{
  "status": "issued",
  "certificate_number": "SEN-2026-000001",
  "certificate_hash": "9f41c2a8...",
  "verification_url": "https://sentinelum.cloud/verify/cert_xxx"
}`}
      </pre>
    </div>
  );
}

import Link from 'next/link';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-cyan-200">Sentinelum</Link>
      <h1 className="mt-12 font-display text-5xl font-semibold">Certificate API</h1>
      <p className="mt-5 max-w-2xl text-slate-300">Create signed human oversight certificates from your AI workflow with one authenticated API call.</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Send your API key as a bearer token. Raw keys are shown once and stored only as hashes.</CardDescription>
          <pre className="mt-5 overflow-x-auto rounded-md bg-black/40 p-4 font-mono text-xs text-slate-300">Authorization: Bearer sen_live_xxx</pre>
        </Card>
        <Card>
          <CardTitle>POST /api/v1/certificates</CardTitle>
          <pre className="mt-5 overflow-x-auto rounded-md bg-black/40 p-4 font-mono text-xs leading-6 text-slate-300">
{`curl -X POST https://sentinelum.cloud/api/v1/certificates \\
  -H "Authorization: Bearer sen_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ai_system_name":"Credit Copilot",
    "model_name":"gpt-5.5",
    "ai_output":"Approve customer for $5,000 credit line.",
    "human_reviewer":{"name":"Sarah Mitchell","email":"sarah@company.com","role":"Risk Analyst"},
    "decision":"approved",
    "decision_notes":"Reviewed and approved.",
    "risk_flags":["credit","financial_decision"],
    "metadata":{"workflow_id":"credit_review_001"}
  }'`}
          </pre>
        </Card>
      </div>
    </main>
  );
}

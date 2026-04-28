'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  const isSchemaError =
    error.message.includes('schema') ||
    error.message.includes('workspace_members') ||
    error.message.includes('PGRST204') ||
    error.message.includes('PGRST205') ||
    error.message.includes('22P02') ||
    error.message.includes('subscription_status');

  return (
    <div className="grid min-h-[70vh] place-items-center">
      <Card className="max-w-2xl">
        <AlertTriangle className="h-9 w-9 text-orange-300" />
        <CardTitle className="mt-5 text-2xl">
          {isSchemaError ? 'Database migration required' : 'Dashboard could not load'}
        </CardTitle>
        <CardDescription>
          {isSchemaError
            ? 'Supabase is reachable, but the database schema is not aligned yet. Run supabase/migrations/001_initial_schema.sql for a fresh project, or supabase/migrations/002_deploy_repair_schema.sql for the current project, then refresh.'
            : 'The dashboard hit an unexpected server-side error. Refresh after checking the server logs.'}
        </CardDescription>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/"><Button variant="secondary">Back to landing</Button></Link>
        </div>
      </Card>
    </div>
  );
}

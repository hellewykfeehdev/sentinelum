'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CheckoutButton({
  children = 'Start protecting AI decisions',
  fallbackHref = '/login?next=/pricing'
}: {
  children?: React.ReactNode;
  fallbackHref?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function startCheckout() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || data.login_url) {
        window.location.href = data.login_url || fallbackHref;
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError(data.error || 'Unable to start checkout.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-2">
      <Button onClick={startCheckout} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {children}
      </Button>
      {error && <span className="text-xs text-orange-200">{error}</span>}
    </span>
  );
}

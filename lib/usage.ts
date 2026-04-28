import { createServiceClient } from '@/lib/supabase/service';
import { stripe } from '@/lib/stripe/client';
import { stripePriceUsage } from '@/lib/env';
import type { WorkspaceRecord } from '@/lib/certificates/schema';

export async function getCurrentPeriodUsage(workspace: Pick<WorkspaceRecord, 'id' | 'usage_period_start' | 'usage_period_end'>) {
  const supabase = createServiceClient();
  let query = supabase
    .from('usage_events')
    .select('quantity')
    .eq('workspace_id', workspace.id)
    .eq('event_type', 'certificate.generated');

  if (workspace.usage_period_start) query = query.gte('created_at', workspace.usage_period_start);
  if (workspace.usage_period_end) query = query.lt('created_at', workspace.usage_period_end);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0);
}

export async function recordCertificateUsage(params: {
  workspace: WorkspaceRecord;
  certificateId: string;
}) {
  const supabase = createServiceClient();
  const usedBefore = await getCurrentPeriodUsage(params.workspace);
  const allowance = params.workspace.annual_certificate_allowance || 10000;
  const isExtraUsage = usedBefore + 1 > allowance;

  const { data: usageEvent, error } = await supabase
    .from('usage_events')
    .insert({
      workspace_id: params.workspace.id,
      certificate_id: params.certificateId,
      event_type: 'certificate.generated',
      quantity: 1,
      included_in_plan: !isExtraUsage,
      reported_to_stripe: false,
      stripe_reported: false
    })
    .select('id')
    .single();

  if (error) throw error;

  if (isExtraUsage && params.workspace.stripe_subscription_id && stripePriceUsage) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        params.workspace.stripe_subscription_id
      );
      const usageItem = subscription.items.data.find((item) => item.price.id === stripePriceUsage);

      if (usageItem) {
        const usageRecord = await stripe.subscriptionItems.createUsageRecord(usageItem.id, {
          quantity: 1,
          timestamp: 'now',
          action: 'increment'
        });

        await supabase
          .from('usage_events')
          .update({
            reported_to_stripe: true,
            stripe_reported: true,
            stripe_event_id: usageRecord.id
          })
          .eq('id', usageEvent.id);
      }
    } catch (error) {
      console.error('Failed to report certificate usage to Stripe', error);
    }
  }

  return { included: !isExtraUsage };
}

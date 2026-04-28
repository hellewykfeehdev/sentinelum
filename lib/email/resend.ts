import { Resend } from 'resend';
import { env } from '@/lib/env';

export async function sendPaymentFailedEmail(email: string, workspaceName: string) {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return;

  const resend = new Resend(env.RESEND_API_KEY);
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Sentinelum billing needs attention',
    text: `Payment failed for ${workspaceName}. Please update your billing details to keep certificate generation active.`
  });
}

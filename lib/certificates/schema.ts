import { z } from 'zod';

export const decisionSchema = z.enum(['approved', 'modified', 'rejected', 'escalated']);

export const certificateCreateSchema = z.object({
  ai_system_name: z.string().min(2).max(120),
  model_name: z.string().min(1).max(120),
  ai_output: z.string().min(1).max(20000),
  human_reviewer: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    role: z.string().min(2).max(120)
  }),
  decision: decisionSchema,
  decision_notes: z.string().min(1).max(4000),
  risk_flags: z.array(z.string().min(1).max(80)).max(30).default([]),
  metadata: z.record(z.unknown()).default({})
});

export type CertificateCreateInput = z.infer<typeof certificateCreateSchema>;

export type WorkspaceRecord = {
  id: string;
  name: string;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  annual_certificate_allowance: number | null;
  usage_period_start: string | null;
  usage_period_end: string | null;
};

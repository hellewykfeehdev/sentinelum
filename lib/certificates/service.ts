import { absoluteUrl } from '@/lib/utils';
import { certificateCreateSchema, type CertificateCreateInput, type WorkspaceRecord } from '@/lib/certificates/schema';
import { generateCertificatePdf } from '@/lib/certificates/pdf';
import { hashApiKey, sha256, signCertificatePayload } from '@/lib/security/crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { uploadCertificatePdf } from '@/lib/storage/r2';
import { recordCertificateUsage } from '@/lib/usage';

const activeStatuses = new Set(['active', 'trialing']);

export async function resolveWorkspaceFromApiKey(rawKey: string) {
  const supabase = createServiceClient();
  const keyHash = hashApiKey(rawKey);

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('id, workspace_id, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (error) throw error;
  if (!apiKey || apiKey.revoked_at) return null;

  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id);

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', apiKey.workspace_id)
    .single();

  if (workspaceError) throw workspaceError;
  return workspace as WorkspaceRecord;
}

export async function createCertificate(params: {
  workspace: WorkspaceRecord;
  payload: CertificateCreateInput;
  actorId?: string | null;
}) {
  const input = certificateCreateSchema.parse(params.payload);
  const supabase = createServiceClient();

  if (!activeStatuses.has(params.workspace.subscription_status || 'incomplete')) {
    throw Object.assign(new Error('Workspace subscription is not active'), { status: 402 });
  }

  const issuedAt = new Date().toISOString();
  const certificateId = crypto.randomUUID();
  const certificateNumber = await nextCertificateNumber();
  const verificationUrl = absoluteUrl(`/verify/${certificateId}`);
  const aiOutputHash = sha256(input.ai_output);

  const proofPayload = {
    id: certificateId,
    certificate_number: certificateNumber,
    workspace_id: params.workspace.id,
    ai_system_name: input.ai_system_name,
    model_name: input.model_name,
    ai_output_hash: aiOutputHash,
    human_reviewer: input.human_reviewer,
    decision: input.decision,
    decision_notes: input.decision_notes,
    risk_flags: input.risk_flags,
    metadata: input.metadata,
    issued_at: issuedAt
  };

  const { payloadHash, certificateHash, signature } = signCertificatePayload(proofPayload);

  const { data: certificate, error } = await supabase
    .from('certificates')
    .insert({
      id: certificateId,
      workspace_id: params.workspace.id,
      certificate_number: certificateNumber,
      ai_system_name: input.ai_system_name,
      model_name: input.model_name,
      ai_output_hash: aiOutputHash,
      human_reviewer_name: input.human_reviewer.name,
      human_reviewer_email: input.human_reviewer.email,
      human_reviewer_role: input.human_reviewer.role,
      decision: input.decision,
      decision_notes: input.decision_notes,
      risk_flags: input.risk_flags,
      metadata: input.metadata,
      payload_hash: payloadHash,
      certificate_hash: certificateHash,
      signature,
      verification_url: verificationUrl,
      status: 'issued',
      issued_at: issuedAt
    })
    .select('*')
    .single();

  if (error) throw error;

  const pdf = await generateCertificatePdf({
    id: certificate.id,
    certificate_number: certificate.certificate_number,
    workspace_name: params.workspace.name,
    ai_system_name: certificate.ai_system_name,
    model_name: certificate.model_name,
    ai_output_hash: certificate.ai_output_hash,
    human_reviewer_name: certificate.human_reviewer_name,
    human_reviewer_email: certificate.human_reviewer_email,
    human_reviewer_role: certificate.human_reviewer_role,
    decision: certificate.decision,
    decision_notes: certificate.decision_notes,
    risk_flags: certificate.risk_flags || [],
    issued_at: certificate.issued_at || certificate.created_at,
    payload_hash: certificate.payload_hash,
    certificate_hash: certificate.certificate_hash,
    signature: certificate.signature,
    verification_url: verificationUrl
  });

  const r2Url = await uploadCertificatePdf(`certificates/${certificate.id}.pdf`, pdf);
  const pdfUrl = r2Url || absoluteUrl(`/api/v1/certificates/${certificate.id}/pdf`);

  const { data: updated, error: updateError } = await supabase
    .from('certificates')
    .update({ pdf_url: pdfUrl })
    .eq('id', certificate.id)
    .select('*')
    .single();

  if (updateError) throw updateError;

  await recordCertificateUsage({ workspace: params.workspace, certificateId: certificate.id });
  await supabase.from('audit_logs').insert({
    workspace_id: params.workspace.id,
    actor_id: params.actorId || null,
    action: 'certificate.created',
    target_type: 'certificate',
    target_id: certificate.id,
    metadata: { certificate_number: certificateNumber }
  });

  return updated;
}

async function nextCertificateNumber() {
  const supabase = createServiceClient();
  const year = new Date().getUTCFullYear();
  const { count, error } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01T00:00:00.000Z`)
    .lt('created_at', `${year + 1}-01-01T00:00:00.000Z`);

  if (error) throw error;
  return `SEN-${year}-${String((count || 0) + 1).padStart(6, '0')}`;
}

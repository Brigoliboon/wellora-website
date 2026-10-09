import type { SupabaseClient } from '@supabase/supabase-js';
import { new_otp_code, sha256_hex } from '@/lib/auth/crypto';
import type { ActivationApproval } from '../models';

export const APPROVAL_TTL_MIN = 5;

export interface CreatedApproval {
  approval: ActivationApproval;
  code: string;
}

export async function create_approval(
  supabase: SupabaseClient,
  input: {
    patient_id: string;
    kit_id: string | null;
    requesting_device_fingerprint: string;
    requesting_push_token?: string | null;
    consent_version?: string | null;
    basic_info?: Record<string, unknown> | null;
  },
): Promise<CreatedApproval> {
  const code = new_otp_code();
  const expires_at = new Date(
    Date.now() + APPROVAL_TTL_MIN * 60 * 1000,
  ).toISOString();
  const { data, error } = await supabase
    .from('activation_approvals')
    .insert({
      patient_id: input.patient_id,
      kit_id: input.kit_id,
      requesting_device_fingerprint: input.requesting_device_fingerprint,
      requesting_push_token: input.requesting_push_token ?? null,
      code_hash: sha256_hex(code),
      consent_version: input.consent_version ?? null,
      basic_info: input.basic_info ?? null,
      expires_at,
    })
    .select()
    .single();
  if (error) throw new Error(`approval create failed: ${error.message}`);
  // TODO(prod): dispatch FCM push to trusted device here
  // (future lib/notify/send_approval_push.ts). Demo polls pending list.
  return { approval: data as ActivationApproval, code };
}

export async function get_approval_by_id(
  supabase: SupabaseClient,
  id: string,
): Promise<ActivationApproval | null> {
  const { data, error } = await supabase
    .from('activation_approvals')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as ActivationApproval;
}

export async function mark_approval(
  supabase: SupabaseClient,
  id: string,
  status: 'approved' | 'denied' | 'expired',
): Promise<void> {
  const { error } = await supabase
    .from('activation_approvals')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending');
  if (error) throw new Error(`approval resolve failed: ${error.message}`);
}

export function is_expired(approval: ActivationApproval): boolean {
  return Date.parse(approval.expires_at) <= Date.now();
}

export function code_matches(approval: ActivationApproval, code: string): boolean {
  return approval.code_hash === sha256_hex(code);
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { new_token, sha256_hex } from '@/lib/auth/crypto';
import type { Session } from '../models';

const SESSION_TTL_DAYS = 30;

export interface IssuedSession {
  session: Session;
  refresh_token: string;
}

export async function issue_session(
  supabase: SupabaseClient,
  patient_id: string,
  device_fingerprint: string | null,
): Promise<IssuedSession> {
  const refresh_token = new_token();
  const expires_at = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      patient_id,
      refresh_token_hash: sha256_hex(refresh_token),
      device_fingerprint,
      expires_at,
    })
    .select()
    .single();
  if (error) throw new Error(`session issue failed: ${error.message}`);
  return { session: data as Session, refresh_token };
}

export async function refresh_session(
  supabase: SupabaseClient,
  session_id: string,
  refresh_token: string,
): Promise<IssuedSession | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', session_id)
    .single();
  if (error || !data) return null;
  const row = data as Session;
  if (row.refresh_token_hash !== sha256_hex(refresh_token)) return null;
  if (Date.parse(row.expires_at) <= Date.now()) return null;
  const next_token = new_token();
  const expires_at = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: updated, error: update_err } = await supabase
    .from('sessions')
    .update({ refresh_token_hash: sha256_hex(next_token), expires_at })
    .eq('id', session_id)
    .select()
    .single();
  if (update_err || !updated) return null;
  return { session: updated as Session, refresh_token: next_token };
}

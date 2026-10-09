import type { SupabaseClient } from '@supabase/supabase-js';
import type { Kit, KitEvent } from '../models';

export async function get_kit_by_qr(
  supabase: SupabaseClient,
  qr_payload: string,
): Promise<Kit | null> {
  const { data, error } = await supabase
    .from('kits')
    .select('*')
    .eq('qr_payload', qr_payload)
    .single();
  if (error) return null;
  return data as Kit;
}

export async function get_kit_by_id(
  supabase: SupabaseClient,
  id: string,
): Promise<Kit | null> {
  const { data, error } = await supabase
    .from('kits')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Kit;
}

export interface ManufactureInput {
  kit_type_id: string;
  qr_payloads: string[];
  expires_at: string;
}

export async function manufacture_kits(
  supabase: SupabaseClient,
  input: ManufactureInput,
): Promise<Kit[]> {
  const rows = input.qr_payloads.map((qr_payload) => ({
    qr_payload,
    kit_type_id: input.kit_type_id,
    status: 'not_activated',
    expires_at: input.expires_at,
  }));
  // Idempotent retry: same qr_payloads do not create duplicates.
  const { data, error } = await supabase
    .from('kits')
    .upsert(rows, { onConflict: 'qr_payload', ignoreDuplicates: true })
    .select();
  if (error) throw new Error(`manufacture failed: ${error.message}`);
  return (data ?? []) as Kit[];
}

export async function log_kit_event(
  supabase: SupabaseClient,
  event: Pick<
    KitEvent,
    'kit_id' | 'from_status' | 'to_status' | 'trigger' | 'actor_role'
  >,
): Promise<void> {
  const { error } = await supabase.from('kit_events').insert(event);
  if (error) throw new Error(`kit event log failed: ${error.message}`);
}

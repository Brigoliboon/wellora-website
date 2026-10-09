import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActorRole, KitStatus, KitTrigger } from '../models';
import { get_kit_by_id, log_kit_event } from './kits';

export type AdvanceResult =
  | { outcome: 'advanced'; status: KitStatus }
  | { outcome: 'already'; status: KitStatus }
  | { outcome: 'noop'; status: KitStatus };

// Conditional status flip with audit. Idempotent: retrying a completed
// transition returns already/noop instead of duplicating events.
export async function advance_kit_status(
  supabase: SupabaseClient,
  kit_id: string,
  from: KitStatus,
  to: KitStatus,
  trigger: KitTrigger,
  actor: ActorRole,
  extra?: Record<string, unknown>,
): Promise<AdvanceResult> {
  const kit = await get_kit_by_id(supabase, kit_id);
  if (!kit) throw new Error('kit not found');
  if (kit.status === to) return { outcome: 'already', status: to };
  if (kit.status !== from) return { outcome: 'noop', status: kit.status };
  const { data, error } = await supabase
    .from('kits')
    .update({ status: to, ...(extra ?? {}) })
    .eq('id', kit_id)
    .eq('status', from)
    .select('status')
    .single();
  if (error || !data) {
    const current = await get_kit_by_id(supabase, kit_id);
    return { outcome: 'noop', status: current?.status ?? kit.status };
  }
  await log_kit_event(supabase, {
    kit_id,
    from_status: from,
    to_status: to,
    trigger,
    actor_role: actor,
  });
  return { outcome: 'advanced', status: to };
}

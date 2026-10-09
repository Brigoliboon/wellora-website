import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActorRole } from '../models';
import { get_kit_by_id, log_kit_event } from './kits';
import { consume_quota, nearest_available_lab } from './labs';

export interface DispatchResult {
  lab_id: string | null;
  quota: 'consumed' | 'rerouted' | 'unassigned' | 'exhausted';
  rerouted_from?: string;
}

// OTW quota (dispatch-day): consume assigned lab's slot; on exhaustion
// auto-reroute to the nearest lab with capacity. Called only on a fresh
// Transporting flip (never on retry) to avoid double-consume.
export async function consume_or_reroute(
  supabase: SupabaseClient,
  kit_id: string,
  actor: ActorRole,
): Promise<DispatchResult> {
  const kit = await get_kit_by_id(supabase, kit_id);
  if (!kit) throw new Error('kit not found');

  if (kit.assigned_lab_id) {
    if (await consume_quota(supabase, kit.assigned_lab_id)) {
      return { lab_id: kit.assigned_lab_id, quota: 'consumed' };
    }
    const alt = await nearest_available_lab(
      supabase,
      null,
      null,
      kit.assigned_lab_id,
    );
    if (!alt) {
      return { lab_id: kit.assigned_lab_id, quota: 'exhausted' };
    }
    await supabase
      .from('kits')
      .update({ assigned_lab_id: alt.id })
      .eq('id', kit_id);
    await consume_quota(supabase, alt.id);
    await log_kit_event(supabase, {
      kit_id,
      from_status: 'transporting',
      to_status: 'transporting',
      trigger: 'lab_reassigned',
      actor_role: actor,
    });
    return { lab_id: alt.id, quota: 'rerouted', rerouted_from: kit.assigned_lab_id };
  }

  // No lab yet (activated without ordering): pin nearest available + consume.
  const alt = await nearest_available_lab(supabase, null, null);
  if (!alt) return { lab_id: null, quota: 'unassigned' };
  await supabase.from('kits').update({ assigned_lab_id: alt.id }).eq('id', kit_id);
  await consume_quota(supabase, alt.id);
  await log_kit_event(supabase, {
    kit_id,
    from_status: 'transporting',
    to_status: 'transporting',
    trigger: 'lab_reassigned',
    actor_role: actor,
  });
  return { lab_id: alt.id, quota: 'rerouted' };
}

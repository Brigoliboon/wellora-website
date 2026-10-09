import type { SupabaseClient } from '@supabase/supabase-js';
import type { Kit } from '../models';

// Allocate N specific pre-printed kits: not_activated + unassigned.
// Claim-then-verify keeps concurrent bulk orders from double-allocating.
export async function allocate_kits(
  supabase: SupabaseClient,
  kit_type_id: string,
  quantity: number,
  order_id: string,
  assigned_lab_id: string,
): Promise<Kit[]> {
  const { data: candidates, error: sel_err } = await supabase
    .from('kits')
    .select('id')
    .eq('kit_type_id', kit_type_id)
    .eq('status', 'not_activated')
    .is('order_id', null)
    .limit(quantity);
  if (sel_err) throw new Error(`kit lookup failed: ${sel_err.message}`);
  if ((candidates ?? []).length < quantity) {
    throw new Error('insufficient kit inventory for this type');
  }
  const ids = (candidates ?? []).map((c) => c.id as string);
  const { data, error: upd_err } = await supabase
    .from('kits')
    .update({ order_id, assigned_lab_id })
    .in('id', ids)
    .is('order_id', null)
    .select();
  if (upd_err) throw new Error(`kit allocation failed: ${upd_err.message}`);
  if ((data ?? []).length < quantity) {
    throw new Error('inventory changed during allocation, retry order');
  }
  return data as Kit[];
}

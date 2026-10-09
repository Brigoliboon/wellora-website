import type { SupabaseClient } from '@supabase/supabase-js';
import type { GeoPoint, Lab } from '../models';

export interface LabWithAvailability extends Lab {
  used_today: number;
  remaining: number | null; // null = unlimited
  is_available: boolean;
  distance_km: number | null; // DB meters/1000 when coords given
  geojson: GeoPoint | null; // Mapbox-ready point
}

function today_iso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function used_map(
  supabase: SupabaseClient,
): Promise<Map<string, number>> {
  const { data: usage } = await supabase
    .from('lab_quota_usage')
    .select('lab_id, used_count')
    .eq('quota_date', today_iso());
  return new Map(
    (usage ?? []).map((u) => [u.lab_id as string, u.used_count as number]),
  );
}

function with_availability<T extends Lab & { distance_km: number | null; geojson: GeoPoint | null }>(
  lab: T,
  used: Map<string, number>,
): LabWithAvailability {
  const used_today = used.get(lab.id) ?? 0;
  const remaining =
    lab.daily_quota === null ? null : lab.daily_quota - used_today;
  return {
    ...lab,
    used_today,
    remaining,
    is_available: remaining === null || remaining > 0,
  };
}

// Availability-aware listing. With coords: PostGIS nearby_labs() (indexed,
// meter-accurate, Mapbox geojson included). Without: plain list, nulls last.
export async function list_labs_with_availability(
  supabase: SupabaseClient,
  at_lat: number | null,
  at_lng: number | null,
): Promise<LabWithAvailability[]> {
  const used = await used_map(supabase);
  if (at_lat !== null && at_lng !== null) {
    const { data, error } = await supabase.rpc('nearby_labs', {
      p_lat: at_lat,
      p_lng: at_lng,
      p_limit: 50,
    });
    if (error) throw new Error(`nearby labs failed: ${error.message}`);
    return ((data ?? []) as Array<
      Lab & { distance_m: number | null; geojson: GeoPoint | null }
    >).map((row) =>
      with_availability(
        {
          ...row,
          location: null,
          distance_km: row.distance_m === null ? null : row.distance_m / 1000,
        },
        used,
      ),
    );
  }
  const { data: labs, error } = await supabase
    .from('labs')
    .select('*')
    .eq('is_active', true);
  if (error) throw new Error(`labs list failed: ${error.message}`);
  return ((labs ?? []) as Lab[]).map((lab) =>
    with_availability({ ...lab, distance_km: null, geojson: null }, used),
  );
}

// Atomic dispatch-day consume via reserve_lab_quota(). Unlimited labs skip.
export async function consume_quota(
  supabase: SupabaseClient,
  lab_id: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('reserve_lab_quota', {
    p_lab_id: lab_id,
    p_day: today_iso(),
    p_n: 1,
  });
  if (error) throw new Error(`quota reserve failed: ${error.message}`);
  return data === true;
}

// Nearest lab with capacity today (for auto-assign + OTW reroute).
export async function nearest_available_lab(
  supabase: SupabaseClient,
  at_lat: number | null,
  at_lng: number | null,
  exclude_lab_id?: string,
): Promise<LabWithAvailability | null> {
  const labs = await list_labs_with_availability(supabase, at_lat, at_lng);
  return (
    labs.find((l) => l.is_available && l.id !== exclude_lab_id) ?? null
  );
}

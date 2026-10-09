import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Clinic, GeoPoint } from '@/lib/supabase/models';

export interface ClinicWithDistance extends Clinic {
  distance_km: number | null;
  geojson: GeoPoint | null;
}

// Partner clinics, nearest first with Mapbox geojson. Plain list without coords.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const q_lat = request.nextUrl.searchParams.get('lat');
  const q_lng = request.nextUrl.searchParams.get('lng');
  const lat = q_lat !== null ? Number(q_lat) : null;
  const lng = q_lng !== null ? Number(q_lng) : null;
  try {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const { data, error } = await supabase.rpc('nearby_clinics', {
        p_lat: lat,
        p_lng: lng,
        p_limit: 50,
      });
      if (error) throw new Error(error.message);
      const clinics = ((data ?? []) as Array<
        Omit<Clinic, 'location' | 'contact' | 'is_active' | 'created_at'> & {
          distance_m: number | null;
          geojson: GeoPoint | null;
        }
      >).map((c) => ({
        ...c,
        distance_km: c.distance_m === null ? null : c.distance_m / 1000,
      }));
      return Response.json({ clinics }, { status: 200 });
    }
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw new Error(error.message);
    const clinics: ClinicWithDistance[] = ((data ?? []) as Clinic[]).map(
      (c) => ({ ...c, distance_km: null, geojson: null }),
    );
    return Response.json({ clinics }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'clinics failed';
    return Response.json({ error: message }, { status: 500 });
  }
}

import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { list_labs_with_availability } from '@/lib/supabase/tables/labs';

// Availability-aware listing (nearest first). remaining/is_available drive the
// frontend disable; advisory only, enforced atomically at OTW time.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const q_lat = request.nextUrl.searchParams.get('lat');
  const q_lng = request.nextUrl.searchParams.get('lng');
  const lat = q_lat !== null ? Number(q_lat) : null;
  const lng = q_lng !== null ? Number(q_lng) : null;
  try {
    const labs = await list_labs_with_availability(
      supabase,
      Number.isFinite(lat) ? lat : null,
      Number.isFinite(lng) ? lng : null,
    );
    return Response.json({ labs }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'labs failed';
    return Response.json({ error: message }, { status: 500 });
  }
}

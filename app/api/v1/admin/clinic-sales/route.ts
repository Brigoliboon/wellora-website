import { createClient } from '@/lib/supabase/server';

// Read-only: drop-off volume per partner clinic (aggregate/anonymized).
// TODO(M11): gate to WellOra admin role.
export async function GET() {
  const supabase = await createClient();
  const [{ data: clinics, error: c_err }, { data: kits, error: k_err }] =
    await Promise.all([
      supabase.from('clinics').select('id, name').eq('is_active', true),
      supabase.from('kits').select('handoff_clinic_id').not('handoff_clinic_id', 'is', null),
    ]);
  if (c_err || k_err) {
    return Response.json(
      { error: c_err?.message ?? k_err?.message },
      { status: 500 },
    );
  }
  const counts = new Map<string, number>();
  for (const k of kits ?? []) {
    const id = k.handoff_clinic_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return Response.json(
    {
      clinics: ((clinics ?? []) as Array<{ id: string; name: string }>).map(
        (c) => ({ ...c, dropoffs: counts.get(c.id) ?? 0 }),
      ),
    },
    { status: 200 },
  );
}

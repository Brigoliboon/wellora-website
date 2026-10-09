import { createClient } from '@/lib/supabase/server';

// Read-only: per-lab pipeline volume (assigned now, testing, reported).
// TODO(M11): gate to WellOra admin role.
export async function GET() {
  const supabase = await createClient();
  const [{ data: labs, error: l_err }, { data: kits, error: k_err }] =
    await Promise.all([
      supabase.from('labs').select('id, name').eq('is_active', true),
      supabase.from('kits').select('assigned_lab_id, status'),
    ]);
  if (l_err || k_err) {
    return Response.json(
      { error: l_err?.message ?? k_err?.message },
      { status: 500 },
    );
  }
  const rows = new Map<
    string,
    { assigned: number; testing: number; completed: number }
  >();
  for (const k of kits ?? []) {
    const id = k.assigned_lab_id as string | null;
    if (!id) continue;
    const r = rows.get(id) ?? { assigned: 0, testing: 0, completed: 0 };
    r.assigned += 1;
    if (k.status === 'testing_in_progress') r.testing += 1;
    if (k.status === 'results_ready') r.completed += 1;
    rows.set(id, r);
  }
  return Response.json(
    {
      labs: ((labs ?? []) as Array<{ id: string; name: string }>).map((l) => ({
        ...l,
        ...(rows.get(l.id) ?? { assigned: 0, testing: 0, completed: 0 }),
      })),
    },
    { status: 200 },
  );
}

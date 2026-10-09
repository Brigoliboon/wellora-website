import { createClient } from '@/lib/supabase/server';

// Read-only: kit distribution across the lifecycle.
// TODO(M11): gate to WellOra admin role.
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('kits').select('status');
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  const by_status: Record<string, number> = {};
  for (const row of data ?? []) {
    const s = row.status as string;
    by_status[s] = (by_status[s] ?? 0) + 1;
  }
  const get = (s: string) => by_status[s] ?? 0;
  return Response.json(
    {
      total: (data ?? []).length,
      by_status,
      funnel: {
        purchased: get('not_activated'),
        activated: get('activated'),
        in_progress:
          get('transporting') + get('testing_in_progress'),
        completed: get('results_ready'),
      },
    },
    { status: 200 },
  );
}

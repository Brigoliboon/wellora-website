import { createClient } from '@/lib/supabase/server';

// Read-only: ratings aggregate across labs (WellOra admin view).
// TODO(M11): gate to WellOra admin role.
export async function GET() {
  const supabase = await createClient();
  const [{ data: labs, error: l_err }, { data: ratings, error: r_err }] =
    await Promise.all([
      supabase.from('labs').select('id, name').eq('is_active', true),
      supabase.from('ratings').select('lab_id, score'),
    ]);
  if (l_err || r_err) {
    return Response.json(
      { error: l_err?.message ?? r_err?.message },
      { status: 500 },
    );
  }
  const by_lab = new Map<string, number[]>();
  for (const r of ratings ?? []) {
    const arr = by_lab.get(r.lab_id as string) ?? [];
    arr.push(r.score as number);
    by_lab.set(r.lab_id as string, arr);
  }
  return Response.json(
    {
      labs: ((labs ?? []) as Array<{ id: string; name: string }>).map((l) => {
        const scores = by_lab.get(l.id) ?? [];
        return {
          ...l,
          count: scores.length,
          avg_score:
            scores.length === 0
              ? null
              : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
        };
      }),
    },
    { status: 200 },
  );
}

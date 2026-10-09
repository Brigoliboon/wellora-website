import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lab, error: lab_err } = await supabase
    .from('labs')
    .select('id, name')
    .eq('id', id)
    .single();
  if (lab_err || !lab) {
    return Response.json({ error: 'lab not found' }, { status: 404 });
  }
  const { data: ratings, error } = await supabase
    .from('ratings')
    .select('score')
    .eq('lab_id', id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  const scores = (ratings ?? []).map((r) => r.score as number);
  const count = scores.length;
  const avg =
    count === 0 ? null : Math.round((scores.reduce((a, b) => a + b, 0) / count) * 10) / 10;
  const distribution = [1, 2, 3, 4, 5].map((s) => ({
    score: s,
    count: scores.filter((v) => v === s).length,
  }));
  return Response.json(
    { lab, count, avg_score: avg, distribution },
    { status: 200 },
  );
}

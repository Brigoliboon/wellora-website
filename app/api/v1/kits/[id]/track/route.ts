import { createClient } from '@/lib/supabase/server';
import { get_kit_by_id } from '@/lib/supabase/tables/kits';

// Tracking read: kit status + full event timeline + lab + report (if any).
// Keyed by kit ID. TODO(M11): role-scope (clinics get handoff metadata only,
// never report/result data) once auth roles land.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const kit = await get_kit_by_id(supabase, id);
  if (!kit) {
    return Response.json({ error: 'kit not found' }, { status: 404 });
  }
  const [{ data: events }, { data: lab }, { data: report }] = await Promise.all([
    supabase
      .from('kit_events')
      .select('from_status, to_status, trigger, actor_role, created_at')
      .eq('kit_id', id)
      .order('created_at'),
    kit.assigned_lab_id
      ? supabase.from('labs').select('id, name').eq('id', kit.assigned_lab_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('reports').select('id, file_type, uploaded_at').eq('kit_id', id).single(),
  ]);
  return Response.json(
    { kit, lab: lab ?? null, report: report ?? null, timeline: events ?? [] },
    { status: 200 },
  );
}

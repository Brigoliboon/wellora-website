import { createClient } from '@/lib/supabase/server';
import { get_kit_by_id, log_kit_event } from '@/lib/supabase/tables/kits';

// Lab attaches report (image scan or soft-copy URL) -> Results Ready.
// THE only manual transition. Requires testing_in_progress; one report per kit.
// TODO: wire Supabase Storage bucket for uploads; file_url accepted as-is for now.
// TODO(M11): gate to the assigned lab's role.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  let body: { lab_id?: string; file_url?: string; file_type?: string; uploaded_by?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!body.file_url || (body.file_type !== 'image' && body.file_type !== 'pdf')) {
    return Response.json(
      { error: 'file_url + file_type [image|pdf] required' },
      { status: 400 },
    );
  }
  const kit = await get_kit_by_id(supabase, id);
  if (!kit) {
    return Response.json({ error: 'kit not found' }, { status: 404 });
  }
  if (kit.status === 'results_ready') {
    return Response.json(
      { kit_id: id, status: kit.status, duplicate: true },
      { status: 200 },
    );
  }
  if (kit.status !== 'testing_in_progress') {
    return Response.json(
      { error: `must be testing_in_progress (now ${kit.status})`, status: kit.status },
      { status: 409 },
    );
  }
  const lab_id = body.lab_id ?? kit.assigned_lab_id;
  if (!lab_id) {
    return Response.json({ error: 'lab_id required' }, { status: 400 });
  }
  const { error: rep_err } = await supabase.from('reports').insert({
    kit_id: id,
    lab_id,
    file_url: body.file_url,
    file_type: body.file_type,
    uploaded_by: body.uploaded_by ?? null,
  });
  if (rep_err) {
    return Response.json(
      { error: `report attach failed: ${rep_err.message}` },
      { status: 500 },
    );
  }
  const { error: upd_err } = await supabase
    .from('kits')
    .update({ status: 'results_ready', assigned_lab_id: lab_id })
    .eq('id', id)
    .eq('status', 'testing_in_progress');
  if (upd_err) {
    return Response.json({ error: upd_err.message }, { status: 500 });
  }
  await log_kit_event(supabase, {
    kit_id: id,
    from_status: 'testing_in_progress',
    to_status: 'results_ready',
    trigger: 'report_attached',
    actor_role: 'lab',
  });
  return Response.json({ kit_id: id, status: 'results_ready' }, { status: 201 });
}

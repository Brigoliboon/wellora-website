import { createClient } from '@/lib/supabase/server';
import { get_kit_by_id } from '@/lib/supabase/tables/kits';
import { advance_kit_status } from '@/lib/supabase/tables/transport';

// Sample arrives at the assigned lab -> Testing in Progress.
// Interim: M3 ordering (which assigns labs) isn't built yet, so arrival accepts
// lab_id and pins assigned_lab_id when unset. TODO(M3): reconcile with order-time assignment.
// TODO(open Q3): confirm whether arrival is an explicit signal (this endpoint)
// vs automatic transit-time trigger.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  let body: { lab_id?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  try {
    const kit = await get_kit_by_id(supabase, id);
    if (!kit) {
      return Response.json({ error: 'kit not found' }, { status: 404 });
    }
    const lab_id = body.lab_id ?? kit.assigned_lab_id;
    if (!lab_id) {
      return Response.json(
        { error: 'lab_id required (no lab assigned yet)' },
        { status: 400 },
      );
    }
    if (kit.assigned_lab_id && kit.assigned_lab_id !== lab_id) {
      return Response.json(
        { error: 'lab mismatch: kit assigned elsewhere' },
        { status: 409 },
      );
    }
    const res = await advance_kit_status(
      supabase,
      id,
      'transporting',
      'testing_in_progress',
      'lab_arrived',
      'lab',
      { assigned_lab_id: lab_id },
    );
    if (res.outcome === 'noop') {
      return Response.json(
        { error: `must be transporting (now ${res.status})`, status: res.status },
        { status: 409 },
      );
    }
    return Response.json(
      { kit_id: id, status: res.status, lab_id },
      { status: 200 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'lab arrival failed';
    return Response.json({ error: message }, { status: 500 });
  }
}

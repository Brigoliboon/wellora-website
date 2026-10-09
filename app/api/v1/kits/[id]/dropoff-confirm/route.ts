import { createClient } from '@/lib/supabase/server';
import { advance_kit_status } from '@/lib/supabase/tables/transport';
import { consume_or_reroute } from '@/lib/supabase/tables/dispatch';

// Clinic confirms patient drop-off -> Transporting. Sets return_method=dropoff.
// TODO(M11): gate to clinic role; clinic_id must belong to caller.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  let body: { clinic_id?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  try {
    const res = await advance_kit_status(
      supabase,
      id,
      'activated',
      'transporting',
      'dropoff_confirm',
      'clinic',
      {
        return_method: 'dropoff',
        ...(body.clinic_id
          ? { handoff_clinic_id: body.clinic_id, handoff_at: new Date().toISOString() }
          : {}),
      },
    );
    if (res.outcome === 'noop') {
      return Response.json(
        { error: `must be activated (now ${res.status})`, status: res.status },
        { status: 409 },
      );
    }
    // Fresh flip only: consume OTW quota (or reroute). Retries skip this.
    const dispatch =
      res.outcome === 'advanced'
        ? await consume_or_reroute(supabase, id, 'clinic')
        : null;
    return Response.json(
      {
        kit_id: id,
        status: res.status,
        clinic_id: body.clinic_id ?? null,
        dispatch,
      },
      { status: 200 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'dropoff confirm failed';
    const code = message === 'kit not found' ? 404 : 500;
    return Response.json({ error: message }, { status: code });
  }
}

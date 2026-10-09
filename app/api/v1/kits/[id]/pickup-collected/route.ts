import { createClient } from '@/lib/supabase/server';
import { advance_kit_status } from '@/lib/supabase/tables/transport';
import { consume_or_reroute } from '@/lib/supabase/tables/dispatch';

// Rider/system confirms pickup collection -> Transporting. Sets return_method=pickup.
// TODO(open Q2): lock down who/what triggers this once the collector actor is defined.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  try {
    const res = await advance_kit_status(
      supabase,
      id,
      'activated',
      'transporting',
      'pickup_collected',
      'system',
      { return_method: 'pickup' },
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
        ? await consume_or_reroute(supabase, id, 'system')
        : null;
    return Response.json({ kit_id: id, status: res.status, dispatch }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'pickup confirm failed';
    const code = message === 'kit not found' ? 404 : 500;
    return Response.json({ error: message }, { status: code });
  }
}

import { createClient } from '@/lib/supabase/server';
import { get_kit_by_id, log_kit_event } from '@/lib/supabase/tables/kits';
import { find_patient_by_mobile } from '@/lib/supabase/tables/patients';

interface ActivateBody {
  mobile?: string;
  device_fingerprint?: string;
  push_token?: string;
  consent_version?: string;
  basic_info?: Record<string, unknown>;
}

// Known-device direct activation. Unknown devices must go through the
// approval flow (resolve -> need_approval -> trusted device approves).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  let body: ActivateBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const kit = await get_kit_by_id(supabase, id);
  if (!kit) {
    return Response.json({ error: 'kit not found' }, { status: 404 });
  }
  // Idempotent: already activated → tracking, no duplicate event.
  if (kit.status !== 'not_activated') {
    return Response.json(
      { action: 'tracking', kit_id: kit.id, status: kit.status },
      { status: 200 },
    );
  }
  if (Date.parse(kit.expires_at) <= Date.now()) {
    return Response.json({ action: 'expired', kit_id: kit.id }, { status: 410 });
  }

  const mobile = (body.mobile ?? '').trim();
  const device_fingerprint = (body.device_fingerprint ?? '').trim();
  if (!mobile || !device_fingerprint) {
    return Response.json(
      { error: 'mobile and device_fingerprint required' },
      { status: 400 },
    );
  }
  if (!body.consent_version) {
    return Response.json({ error: 'consent_version required' }, { status: 400 });
  }

  const patient = await find_patient_by_mobile(supabase, mobile);
  const known =
    !!patient?.trusted_device_fingerprint &&
    patient.trusted_device_fingerprint === device_fingerprint;
  if (!patient || !known) {
    return Response.json(
      { error: 'approval_required: unknown device, resolve for approval first' },
      { status: 401 },
    );
  }
  if (body.push_token) {
    await supabase
      .from('patients')
      .update({ push_token: body.push_token })
      .eq('id', patient.id);
  }

  // Conditional flip: only from not_activated (race-safe).
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('kits')
    .update({
      patient_id: patient.id,
      consent_given_at: now,
      consent_version: body.consent_version,
      basic_info: body.basic_info ?? null,
      status: 'activated',
      activated_at: now,
    })
    .eq('id', kit.id)
    .eq('status', 'not_activated')
    .select()
    .single();
  if (error || !data) {
    return Response.json(
      { action: 'tracking', kit_id: kit.id, status: 'activated' },
      { status: 200 },
    );
  }
  await log_kit_event(supabase, {
    kit_id: kit.id,
    from_status: 'not_activated',
    to_status: 'activated',
    trigger: 'activated',
    actor_role: 'patient',
  });
  return Response.json({ action: 'activated', kit_id: kit.id }, { status: 200 });
}

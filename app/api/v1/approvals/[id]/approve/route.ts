import { createClient } from '@/lib/supabase/server';
import { find_patient_by_mobile } from '@/lib/supabase/tables/patients';
import {
  code_matches,
  get_approval_by_id,
  is_expired,
  mark_approval,
} from '@/lib/supabase/tables/approvals';
import { log_kit_event } from '@/lib/supabase/tables/kits';

// Trusted device approves by entering the code shown on the requesting device.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  let body: { mobile?: string; device_fingerprint?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const mobile = (body.mobile ?? '').trim();
  const device_fingerprint = (body.device_fingerprint ?? '').trim();
  const code = (body.code ?? '').trim();
  if (!mobile || !device_fingerprint || !code) {
    return Response.json(
      { error: 'mobile, device_fingerprint and code required (no blind-approve)' },
      { status: 400 },
    );
  }
  const approval = await get_approval_by_id(supabase, id);
  if (!approval) {
    return Response.json({ error: 'approval not found' }, { status: 404 });
  }
  if (approval.status !== 'pending') {
    return Response.json(
      { error: `already ${approval.status}` },
      { status: 409 },
    );
  }
  if (is_expired(approval)) {
    await mark_approval(supabase, id, 'expired');
    return Response.json({ error: 'approval expired' }, { status: 410 });
  }
  const patient = await find_patient_by_mobile(supabase, mobile);
  if (
    !patient ||
    patient.id !== approval.patient_id ||
    patient.trusted_device_fingerprint !== device_fingerprint
  ) {
    return Response.json(
      { error: 'only the trusted device can approve' },
      { status: 403 },
    );
  }
  if (!code_matches(approval, code)) {
    return Response.json({ error: 'wrong code' }, { status: 401 });
  }

  await mark_approval(supabase, id, 'approved');
  // Rebind: requesting device overwrites trust (single-device model).
  await supabase
    .from('patients')
    .update({
      trusted_device_fingerprint: approval.requesting_device_fingerprint,
      push_token: approval.requesting_push_token,
    })
    .eq('id', patient.id);

  // Kit-bound approval: apply stored consent and flip to activated (best-effort).
  let kit_status: string | null = null;
  if (approval.kit_id) {
    const { data: kit } = await supabase
      .from('kits')
      .select('id, status, expires_at')
      .eq('id', approval.kit_id)
      .single();
    if (kit && kit.status === 'not_activated' && Date.parse(kit.expires_at) > Date.now()) {
      const now = new Date().toISOString();
      await supabase
        .from('kits')
        .update({
          patient_id: patient.id,
          consent_given_at: now,
          consent_version: approval.consent_version,
          basic_info: approval.basic_info,
          status: 'activated',
          activated_at: now,
        })
        .eq('id', kit.id)
        .eq('status', 'not_activated');
      await log_kit_event(supabase, {
        kit_id: kit.id,
        from_status: 'not_activated',
        to_status: 'activated',
        trigger: 'activated',
        actor_role: 'patient',
      });
      kit_status = 'activated';
    } else {
      kit_status = kit?.status ?? null;
    }
  }
  return Response.json(
    { status: 'approved', approval_id: id, kit_id: approval.kit_id, kit_status },
    { status: 200 },
  );
}

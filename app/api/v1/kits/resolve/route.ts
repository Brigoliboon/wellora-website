import { createClient } from '@/lib/supabase/server';
import { get_kit_by_qr } from '@/lib/supabase/tables/kits';
import {
  find_or_create_patient,
  set_trusted_device,
} from '@/lib/supabase/tables/patients';
import { create_approval } from '@/lib/supabase/tables/approvals';

export async function POST(request: Request) {
  const supabase = await createClient();
  let body: {
    qr_payload?: string;
    mobile?: string;
    device_fingerprint?: string;
    push_token?: string;
    consent_version?: string;
    basic_info?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!body.qr_payload) {
    return Response.json({ error: 'qr_payload required' }, { status: 400 });
  }
  const kit = await get_kit_by_qr(supabase, body.qr_payload);
  if (!kit) {
    return Response.json({ error: 'kit not found' }, { status: 404 });
  }
  // Status check first: already activated → tracking, nothing else runs.
  if (kit.status !== 'not_activated') {
    return Response.json(
      { action: 'tracking', kit_id: kit.id, status: kit.status },
      { status: 200 },
    );
  }
  if (Date.parse(kit.expires_at) <= Date.now()) {
    return Response.json({ action: 'expired', kit_id: kit.id }, { status: 200 });
  }
  const mobile = (body.mobile ?? '').trim();
  const device_fingerprint = (body.device_fingerprint ?? '').trim();
  if (!mobile || !device_fingerprint) {
    return Response.json(
      { error: 'mobile and device_fingerprint required for inactive kits' },
      { status: 400 },
    );
  }
  const { patient } = await find_or_create_patient(supabase, mobile);

  // Bootstrap: first activation for this number auto-trusts this device.
  if (!patient.trusted_device_fingerprint) {
    await set_trusted_device(supabase, patient.id, device_fingerprint);
    if (body.push_token) {
      await supabase
        .from('patients')
        .update({ push_token: body.push_token })
        .eq('id', patient.id);
    }
    return Response.json(
      { action: 'need_consent', kit_id: kit.id, auto_trusted: true },
      { status: 200 },
    );
  }
  // Known device skips approval entirely.
  if (patient.trusted_device_fingerprint === device_fingerprint) {
    return Response.json(
      { action: 'need_consent', kit_id: kit.id },
      { status: 200 },
    );
  }
  // Unknown device: consent required up front, then approval by trusted device.
  if (!body.consent_version) {
    return Response.json(
      { error: 'consent_version required (collected before approval)' },
      { status: 400 },
    );
  }
  const { approval, code } = await create_approval(supabase, {
    patient_id: patient.id,
    kit_id: kit.id,
    requesting_device_fingerprint: device_fingerprint,
    requesting_push_token: body.push_token ?? null,
    consent_version: body.consent_version,
    basic_info: body.basic_info ?? null,
  });
  // Code shown ONLY on the requesting device; trusted device approves with it.
  return Response.json(
    {
      action: 'need_approval',
      kit_id: kit.id,
      approval_id: approval.id,
      code,
      expires_at: approval.expires_at,
    },
    { status: 201 },
  );
}

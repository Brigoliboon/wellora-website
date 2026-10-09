import { createClient } from '@/lib/supabase/server';
import {
  find_or_create_patient,
  set_trusted_device,
} from '@/lib/supabase/tables/patients';
import { issue_session } from '@/lib/supabase/tables/sessions';
import { create_approval } from '@/lib/supabase/tables/approvals';

// Device login. Known device -> session immediately. Unknown device ->
// approval by trusted device (kit_id null). First touch auto-trusts.
export async function POST(request: Request) {
  const supabase = await createClient();
  let body: { mobile?: string; device_fingerprint?: string; push_token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const mobile = (body.mobile ?? '').trim();
  const device_fingerprint = (body.device_fingerprint ?? '').trim();
  if (!mobile || !device_fingerprint) {
    return Response.json(
      { error: 'mobile and device_fingerprint required' },
      { status: 400 },
    );
  }
  const { patient } = await find_or_create_patient(supabase, mobile);
  if (
    !patient.trusted_device_fingerprint ||
    patient.trusted_device_fingerprint === device_fingerprint
  ) {
    if (!patient.trusted_device_fingerprint) {
      await set_trusted_device(supabase, patient.id, device_fingerprint);
    }
    if (body.push_token) {
      await supabase
        .from('patients')
        .update({ push_token: body.push_token })
        .eq('id', patient.id);
    }
    const { session, refresh_token } = await issue_session(
      supabase,
      patient.id,
      device_fingerprint,
    );
    return Response.json(
      {
        status: 'active',
        patient_id: patient.id,
        session_id: session.id,
        refresh_token,
        expires_at: session.expires_at,
      },
      { status: 200 },
    );
  }
  const { approval, code } = await create_approval(supabase, {
    patient_id: patient.id,
    kit_id: null,
    requesting_device_fingerprint: device_fingerprint,
    requesting_push_token: body.push_token ?? null,
  });
  return Response.json(
    {
      status: 'pending',
      approval_id: approval.id,
      code,
      expires_at: approval.expires_at,
    },
    { status: 202 },
  );
}

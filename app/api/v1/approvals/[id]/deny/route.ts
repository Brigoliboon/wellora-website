import { createClient } from '@/lib/supabase/server';
import { find_patient_by_mobile } from '@/lib/supabase/tables/patients';
import { get_approval_by_id, mark_approval } from '@/lib/supabase/tables/approvals';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  let body: { mobile?: string; device_fingerprint?: string };
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
  const patient = await find_patient_by_mobile(supabase, mobile);
  if (
    !patient ||
    patient.id !== approval.patient_id ||
    patient.trusted_device_fingerprint !== device_fingerprint
  ) {
    return Response.json(
      { error: 'only the trusted device can deny' },
      { status: 403 },
    );
  }
  await mark_approval(supabase, id, 'denied');
  return Response.json({ status: 'denied', approval_id: id }, { status: 200 });
}

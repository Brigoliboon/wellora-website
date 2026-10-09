import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { find_patient_by_mobile } from '@/lib/supabase/tables/patients';

// Trusted device polls pending approvals. Payloads exclude code hashes.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const mobile = request.nextUrl.searchParams.get('mobile') ?? '';
  if (!mobile) {
    return Response.json({ error: 'mobile required' }, { status: 400 });
  }
  const patient = await find_patient_by_mobile(supabase, mobile);
  if (!patient) {
    return Response.json({ approvals: [] }, { status: 200 });
  }
  const { data, error } = await supabase
    .from('activation_approvals')
    .select(
      'id, kit_id, requesting_device_fingerprint, consent_version, status, expires_at, created_at',
    )
    .eq('patient_id', patient.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ approvals: data ?? [] }, { status: 200 });
}

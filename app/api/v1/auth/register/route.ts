import { createClient } from '@/lib/supabase/server';
import { find_or_create_patient } from '@/lib/supabase/tables/patients';

export async function POST(request: Request) {
  const supabase = await createClient();
  let body: { mobile?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const mobile = (body.mobile ?? '').trim();
  if (!mobile || mobile.length < 7) {
    return Response.json({ error: 'mobile required' }, { status: 400 });
  }
  try {
    const { patient, created } = await find_or_create_patient(supabase, mobile);
    return Response.json(
      { patient_id: patient.id, mobile: patient.mobile, created },
      { status: created ? 201 : 200 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'register failed';
    return Response.json({ error: message }, { status: 500 });
  }
}

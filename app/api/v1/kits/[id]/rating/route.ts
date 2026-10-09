import { createClient } from '@/lib/supabase/server';
import { get_kit_by_id } from '@/lib/supabase/tables/kits';
import { find_patient_by_mobile } from '@/lib/supabase/tables/patients';

// One rating per completed kit. Lab + patient derived from the kit row itself
// (never trusted from the client). Requires results_ready (proof of service).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  let body: { mobile?: string; score?: number; comment?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const score = body.score ?? 0;
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return Response.json({ error: 'score must be 1..5' }, { status: 400 });
  }
  const mobile = (body.mobile ?? '').trim();
  if (!mobile) {
    return Response.json({ error: 'mobile required' }, { status: 400 });
  }
  const kit = await get_kit_by_id(supabase, id);
  if (!kit) {
    return Response.json({ error: 'kit not found' }, { status: 404 });
  }
  if (kit.status !== 'results_ready') {
    return Response.json(
      { error: `only completed kits can be rated (now ${kit.status})` },
      { status: 409 },
    );
  }
  if (!kit.assigned_lab_id || !kit.patient_id) {
    return Response.json({ error: 'kit missing lab/patient link' }, { status: 500 });
  }
  const patient = await find_patient_by_mobile(supabase, mobile);
  if (!patient || patient.id !== kit.patient_id) {
    return Response.json(
      { error: 'only the kit owner can rate' },
      { status: 403 },
    );
  }
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      kit_id: id,
      lab_id: kit.assigned_lab_id,
      patient_id: patient.id,
      score,
      comment: body.comment ?? null,
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      return Response.json(
        { error: 'kit already rated', kit_id: id },
        { status: 409 },
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ rating: data }, { status: 201 });
}

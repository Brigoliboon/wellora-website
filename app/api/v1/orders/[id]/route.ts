import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !order) {
    return Response.json({ error: 'order not found' }, { status: 404 });
  }
  const [{ data: kits }, { data: lab }] = await Promise.all([
    supabase.from('kits').select('id, qr_payload, status').eq('order_id', id),
    supabase.from('labs').select('id, name').eq('id', order.assigned_lab_id).single(),
  ]);
  return Response.json(
    { order, lab: lab ?? null, kits: kits ?? [] },
    { status: 200 },
  );
}

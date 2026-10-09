import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('kit_types')
    .select('id, slug, name, individual_price, bulk_price, bulk_min_qty')
    .order('name');
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ catalog: data ?? [] }, { status: 200 });
}

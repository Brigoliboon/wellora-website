import { createClient } from '@/lib/supabase/server';
import { find_or_create_patient } from '@/lib/supabase/tables/patients';
import { allocate_kits } from '@/lib/supabase/tables/orders';
import { nearest_available_lab } from '@/lib/supabase/tables/labs';
import { log_kit_event } from '@/lib/supabase/tables/kits';

// TODO(open Q5): delivery fee rules are a flat placeholder (shipped=50, pickup=0).
const SHIPPED_FEE = 50;
const MAX_QTY = 100;

interface OrderBody {
  mobile?: string;
  kit_type_id?: string;
  kit_type_slug?: 'urinalysis' | 'fecalysis' | 'oral';
  quantity?: number;
  assignment_mode?: 'auto' | 'manual';
  lab_id?: string;
  delivery_method?: 'pickup' | 'shipped';
  lat?: number;
  lng?: number;
}

// Assign lab at order time (advisory quota check only). Quota is consumed
// atomically later, at OTW (drop-off/pickup confirm), with auto-reroute.
export async function POST(request: Request) {
  const supabase = await createClient();
  let body: OrderBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const mobile = (body.mobile ?? '').trim();
  const quantity = body.quantity ?? 0;
  if (!mobile) {
    return Response.json({ error: 'mobile required' }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
    return Response.json(
      { error: `quantity must be 1..${MAX_QTY}` },
      { status: 400 },
    );
  }
  if (body.delivery_method !== 'pickup' && body.delivery_method !== 'shipped') {
    return Response.json(
      { error: 'delivery_method [pickup|shipped] required' },
      { status: 400 },
    );
  }

  // Resolve kit type + pricing.
  let type_row = null;
  if (body.kit_type_id) {
    const { data } = await supabase
      .from('kit_types')
      .select('*')
      .eq('id', body.kit_type_id)
      .single();
    type_row = data;
  } else if (body.kit_type_slug) {
    const { data } = await supabase
      .from('kit_types')
      .select('*')
      .eq('slug', body.kit_type_slug)
      .single();
    type_row = data;
  }
  if (!type_row) {
    return Response.json({ error: 'unknown kit type' }, { status: 400 });
  }
  const unit =
    quantity >= type_row.bulk_min_qty
      ? Number(type_row.bulk_price)
      : Number(type_row.individual_price);
  const delivery_fee = body.delivery_method === 'shipped' ? SHIPPED_FEE : 0;
  const total = unit * quantity + delivery_fee;

  // Assign lab (advisory availability; hard enforcement happens at OTW).
  const mode = body.assignment_mode ?? 'auto';
  let assigned_lab_id: string | null = null;
  let quota_warning = false;
  if (mode === 'manual') {
    if (!body.lab_id) {
      return Response.json(
        { error: 'lab_id required for manual assignment' },
        { status: 400 },
      );
    }
    const { data: lab } = await supabase
      .from('labs')
      .select('id, daily_quota, is_active')
      .eq('id', body.lab_id)
      .single();
    if (!lab || !lab.is_active) {
      return Response.json({ error: 'unknown or inactive lab' }, { status: 400 });
    }
    assigned_lab_id = lab.id;
    if (lab.daily_quota !== null) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await supabase
        .from('lab_quota_usage')
        .select('used_count')
        .eq('lab_id', lab.id)
        .eq('quota_date', today)
        .single();
      if ((usage?.used_count ?? 0) + quantity > lab.daily_quota) {
        quota_warning = true; // advisory: OTW reroute guarantees a lab
      }
    }
  } else {
    const lab = await nearest_available_lab(
      supabase,
      body.lat ?? null,
      body.lng ?? null,
    );
    if (!lab) {
      return Response.json({ error: 'no labs available' }, { status: 503 });
    }
    assigned_lab_id = lab.id;
    quota_warning = !lab.is_available; // nearest exists but full today
  }

  try {
    const { patient } = await find_or_create_patient(supabase, mobile);
    const { data: order, error: ord_err } = await supabase
      .from('orders')
      .insert({
        patient_id: patient.id,
        assigned_lab_id,
        assignment_mode: mode,
        delivery_method: body.delivery_method,
        delivery_fee,
        payment_status: 'initiated',
        total_amount: total,
      })
      .select()
      .single();
    if (ord_err || !order) {
      return Response.json({ error: 'order create failed' }, { status: 500 });
    }
    try {
      const kits = await allocate_kits(
        supabase,
        type_row.id,
        quantity,
        order.id,
        assigned_lab_id!,
      );
      const { error: link_err } = await supabase
        .from('order_kits')
        .insert(kits.map((k) => ({ order_id: order.id, kit_id: k.id })));
      if (link_err) throw new Error(link_err.message);
      for (const k of kits) {
        await log_kit_event(supabase, {
          kit_id: k.id,
          from_status: 'not_activated',
          to_status: 'not_activated',
          trigger: 'ordered',
          actor_role: 'patient',
        });
      }
      return Response.json(
        {
          order,
          kits: kits.map((k) => ({ id: k.id, qr_payload: k.qr_payload })),
          quota_warning,
        },
        { status: 201 },
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'allocation failed';
      return Response.json(
        { error: message, order_id: order.id },
        { status: 409 },
      );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'order failed';
    return Response.json({ error: message }, { status: 500 });
  }
}

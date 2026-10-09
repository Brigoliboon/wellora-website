import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import {
  manufacture_kits,
  log_kit_event,
} from '@/lib/supabase/tables/kits';

interface ManufactureBody {
  kit_type_id?: string;
  kit_type_slug?: 'urinalysis' | 'fecalysis' | 'oral';
  qr_payloads?: string[];
  quantity?: number;
  qr_prefix?: string;
  expires_at?: string;
}

const MAX_BATCH = 500;

export async function POST(request: Request) {
  // TODO(M11): gate to admin/manufacturer role once M1 auth lands. Open for seeding.
  const supabase = await createClient();
  let body: ManufactureBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  // Resolve kit type to id.
  let kit_type_id = body.kit_type_id ?? null;
  if (!kit_type_id && body.kit_type_slug) {
    const { data, error } = await supabase
      .from('kit_types')
      .select('id')
      .eq('slug', body.kit_type_slug)
      .single();
    if (error || !data) {
      return Response.json({ error: 'unknown kit_type_slug' }, { status: 400 });
    }
    kit_type_id = data.id;
  }
  if (!kit_type_id) {
    return Response.json(
      { error: 'kit_type_id or kit_type_slug required' },
      { status: 400 },
    );
  }

  const expires_at = body.expires_at ?? null;
  if (!expires_at || Number.isNaN(Date.parse(expires_at))) {
    return Response.json(
      { error: 'expires_at (ISO date) required' },
      { status: 400 },
    );
  }
  if (Date.parse(expires_at) <= Date.now()) {
    return Response.json(
      { error: 'expires_at must be in the future' },
      { status: 400 },
    );
  }

  // Build QR payload list: explicit payloads preferred (idempotent retry).
  let qr_payloads = (body.qr_payloads ?? []).filter(Boolean);
  if (qr_payloads.length === 0 && body.quantity) {
    if (body.quantity < 1 || body.quantity > MAX_BATCH) {
      return Response.json(
        { error: `quantity must be 1..${MAX_BATCH}` },
        { status: 400 },
      );
    }
    const prefix = body.qr_prefix ?? 'WELLORA';
    qr_payloads = Array.from({ length: body.quantity }, () => `${prefix}-${randomUUID()}`);
  }
  if (qr_payloads.length === 0 || qr_payloads.length > MAX_BATCH) {
    return Response.json(
      { error: `qr_payloads (1..${MAX_BATCH}) or quantity required` },
      { status: 400 },
    );
  }

  try {
    const kits = await manufacture_kits(supabase, {
      kit_type_id,
      qr_payloads,
      expires_at,
    });
    // Audit: manufactured event per newly created kit (duplicates skipped by upsert).
    for (const kit of kits) {
      await log_kit_event(supabase, {
        kit_id: kit.id,
        from_status: null,
        to_status: 'not_activated',
        trigger: 'manufactured',
        actor_role: 'manufacturer',
      });
    }
    return Response.json(
      { created: kits.length, skipped: qr_payloads.length - kits.length, kits },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : 'manufacture failed';
    return Response.json({ error: message }, { status: 500 });
  }
}

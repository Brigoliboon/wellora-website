import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  get_approval_by_id,
  is_expired,
  mark_approval,
} from '@/lib/supabase/tables/approvals';

// Requesting device polls its own approval. Never exposes the code hash.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const device = request.nextUrl.searchParams.get('device_fingerprint') ?? '';
  const approval = await get_approval_by_id(supabase, id);
  if (!approval) {
    return Response.json({ error: 'approval not found' }, { status: 404 });
  }
  if (device && device !== approval.requesting_device_fingerprint) {
    return Response.json({ error: 'not your approval' }, { status: 403 });
  }
  if (approval.status === 'pending' && is_expired(approval)) {
    await mark_approval(supabase, id, 'expired');
    return Response.json({ status: 'expired', approval_id: id }, { status: 200 });
  }
  const { code_hash: _code_hash, ...safe } = approval;
  void _code_hash;
  return Response.json(safe, { status: 200 });
}

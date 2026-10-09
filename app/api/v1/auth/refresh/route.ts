import { createClient } from '@/lib/supabase/server';
import { refresh_session } from '@/lib/supabase/tables/sessions';

export async function POST(request: Request) {
  const supabase = await createClient();
  let body: { session_id?: string; refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!body.session_id || !body.refresh_token) {
    return Response.json(
      { error: 'session_id and refresh_token required' },
      { status: 400 },
    );
  }
  const rotated = await refresh_session(
    supabase,
    body.session_id,
    body.refresh_token,
  );
  if (!rotated) {
    return Response.json(
      { error: 'invalid or expired session' },
      { status: 401 },
    );
  }
  return Response.json(
    {
      session_id: rotated.session.id,
      refresh_token: rotated.refresh_token,
      expires_at: rotated.session.expires_at,
    },
    { status: 200 },
  );
}

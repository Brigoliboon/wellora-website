import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase_key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function createClient() {
  const cookie_store = await cookies();
  return createServerClient(supabase_url!, supabase_key!, {
    cookies: {
      getAll() {
        return cookie_store.getAll();
      },
      setAll(cookies_to_set) {
        try {
          cookies_to_set.forEach(({ name, value, options }) =>
            cookie_store.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — proxy.ts refreshes sessions.
        }
      },
    },
  });
}

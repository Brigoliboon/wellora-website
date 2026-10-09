import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase_key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function proxy(request: NextRequest) {
  let supabase_response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabase_url!, supabase_key!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies_to_set) {
        cookies_to_set.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabase_response = NextResponse.next({
          request,
        });
        cookies_to_set.forEach(({ name, value, options }) =>
          supabase_response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refreshes session via getClaims (verified, not getSession). Keeps users signed in.
  await supabase.auth.getClaims();

  return supabase_response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

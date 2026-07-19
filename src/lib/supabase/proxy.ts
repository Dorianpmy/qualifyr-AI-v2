import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv } from "@/config/env";
import { getAuthRedirect } from "@/features/auth/utils";
import type { Database } from "@/types/database.generated";

export async function refreshAuthSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getPublicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  // Validates the token and refreshes it when necessary. Authorization remains
  // enforced by Server Components/Actions and Postgres RLS, never by proxy alone.
  const { data, error } = await supabase.auth.getClaims();
  const authenticated = !error && Boolean(data?.claims.sub);
  const authRedirect = getAuthRedirect(
    request.nextUrl.pathname,
    authenticated,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  if (authRedirect) {
    const redirectResponse = NextResponse.redirect(new URL(authRedirect, request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    for (const headerName of ["cache-control", "expires", "pragma"]) {
      const headerValue = response.headers.get(headerName);
      if (headerValue) redirectResponse.headers.set(headerName, headerValue);
    }
    return redirectResponse;
  }

  return response;
}

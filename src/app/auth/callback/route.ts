import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Lądowanie po kliknięciu w link z maila.
 *
 * Obsługujemy dwa warianty, bo zależą od szablonu maila:
 *  - `code`       — domyślne szablony Supabase (przez /auth/v1/verify), PKCE
 *  - `token_hash` — własne szablony; działa też, gdy link otwarto w innej
 *                   przeglądarce niż ta, w której powstał code verifier
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "production" && forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  const nextParam = searchParams.get("next");
  const next =
    nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const fail = (reason: string) =>
    NextResponse.redirect(
      `${base}/login?error=${encodeURIComponent(reason)}`,
    );

  const supabase = await createClient();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (tokenHash && type && OTP_TYPES.includes(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    return error ? fail(error.message) : NextResponse.redirect(`${base}${next}`);
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? fail(error.message) : NextResponse.redirect(`${base}${next}`);
  }

  return fail(
    searchParams.get("error_description") ??
      "Link jest niekompletny albo wygasł.",
  );
}

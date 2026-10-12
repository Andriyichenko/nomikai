import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { publicOrigin } from "@/lib/links";

/**
 * Lands both sign-in flows:
 * - Google OAuth / PKCE: `?code=…`
 * - Email link: `?token_hash=…&type=email` (see the email templates in README). Verifying the
 *   token hash works even when the mail is opened in a different browser or a mail app's webview.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicOrigin(request);
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const supabase = await createClient();

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    // Sign-in links usually open in a new tab: /auth/done hands the session back to the tab the
    // member asked from (LoginPanel) instead of leaving them on a second copy of the site.
    // Password recovery has to continue in this tab (/reset-password).
    if (!error)
      return NextResponse.redirect(
        type === "recovery" ? `${origin}${next}` : `${origin}/auth/done?next=${encodeURIComponent(next)}`,
      );
  }

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=1`);
}

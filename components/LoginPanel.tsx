"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";

/** Password-less sign-in: Google OAuth or an email magic link. Returns to `next` afterwards. */
export default function LoginPanel({ t, next = "/" }: { t: Dict["login"]; next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const google = async () => {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setState("error");
    }
  };

  const magic = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  };

  return (
    <div className="w-full">
      <button type="button" onClick={google} className="btn btn-primary w-full">
        <svg aria-hidden width="16" height="16" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
        </svg>
        {t.google}
      </button>

      <div className="my-6 flex items-center gap-4 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      {state === "sent" ? (
        <p className="rounded-xl border border-line bg-paper-2 p-4 text-sm leading-relaxed">{t.sent}</p>
      ) : (
        <form onSubmit={magic} className="space-y-3">
          <label className="label" htmlFor="login-email">{t.email}</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="you@example.com"
          />
          <button type="submit" disabled={state === "sending"} className="btn btn-ghost w-full">
            {state === "sending" ? "…" : t.sendLink}
          </button>
        </form>
      )}
      {state === "error" && <p className="mt-3 text-sm text-accent">{error}</p>}
    </div>
  );
}

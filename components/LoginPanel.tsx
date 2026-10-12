"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";
import { openAuthChannel } from "@/lib/auth-sync";

type Mode = "login" | "signup" | "forgot";

/**
 * Google OAuth, or email with the member's choice of password or a one-time mail link.
 * Sign-up asks for a display name (stored as `full_name`, which the DB trigger copies into
 * the profile); "forgot" sends a recovery link that lands on /reset-password.
 *
 * After a mail is sent this panel stays put and signs in by itself when the link is opened in
 * another tab of the same browser (/auth/done → lib/auth-sync), or when the member types the
 * one-time code from the mail — which also works when the link opened in a different browser.
 */
export default function LoginPanel({
  t,
  next = "/",
  initial = "login",
  onSignedIn,
}: {
  t: Dict["login"];
  next?: string;
  initial?: "login" | "signup";
  /** called instead of navigating to `next` (e.g. the vote form's login dialog just closes) */
  onSignedIn?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initial);
  const [method, setMethod] = useState<"password" | "link">("password");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const finished = useRef(false);

  const callback = (to: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;
  const fail = (msg: string) => {
    setError(msg);
    setState("error");
  };

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    if (onSignedIn) onSignedIn();
    else router.replace(next);
    router.refresh();
  }, [next, onSignedIn, router]);

  // Waiting for the mail: hand-off from the tab that opened the link, or a session cookie that
  // appeared meanwhile (checked when the member comes back to this tab, and every few seconds).
  const waiting = state === "sent" && mode !== "forgot";
  useEffect(() => {
    if (!waiting) return;
    const supabase = createClient();
    const ch = openAuthChannel((m) => {
      if (m.type !== "signed-in") return;
      ch?.postMessage({ type: "ack" });
      finish();
    });
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) finish();
    };
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    const iv = window.setInterval(check, 4000);
    return () => {
      ch?.close();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      window.clearInterval(iv);
    };
  }, [waiting, finish]);

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (!token) return;
    setVerifying(true);
    setError("");
    const supabase = createClient();
    // "email" covers magic-link and new-user codes; password sign-ups confirm with "signup"
    let { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    if (error && mode === "signup") ({ error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: "signup" }));
    setVerifying(false);
    if (error) return setError(t.codeError);
    finish();
  };

  const google = async () => {
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(next) } });
    if (error) fail(error.message);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const mail = email.trim();

    if (mode !== "forgot" && method === "link") {
      setState("sending");
      const { error } = await supabase.auth.signInWithOtp({
        email: mail,
        options: {
          emailRedirectTo: callback(next),
          shouldCreateUser: true,
          ...(mode === "signup" && name.trim() ? { data: { full_name: name.trim() } } : {}),
        },
      });
      if (error) return fail(error.message);
      setState("sent");
      return;
    }

    if (mode === "login") {
      setState("sending");
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
      if (error) {
        const m = error.message.toLowerCase();
        return fail(m.includes("confirm") ? t.errUnconfirmed : m.includes("invalid") ? t.errInvalid : error.message);
      }
      router.replace(next);
      router.refresh();
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) return fail(t.errShort);
      if (password !== confirm) return fail(t.errMismatch);
      setState("sending");
      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password,
        options: { emailRedirectTo: callback(next), data: name.trim() ? { full_name: name.trim() } : undefined },
      });
      if (error) return fail(error.message.toLowerCase().includes("registered") ? t.errExists : error.message);
      // Supabase returns a user with no identities when the address is already registered
      if (data.user && data.user.identities?.length === 0) return fail(t.errExists);
      if (data.session) {
        // "Confirm email" is off in Supabase: signed in right away
        router.replace(next);
        router.refresh();
        return;
      }
      setState("sent");
      return;
    }

    // forgot
    setState("sending");
    const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: callback("/reset-password") });
    if (error) return fail(error.message);
    setState("sent");
  };

  const switchTo = (m: Mode) => {
    setMode(m);
    setState("idle");
    setError("");
    setPassword("");
    setConfirm("");
  };

  const sentText = mode === "forgot" ? t.sentReset : method === "link" && mode === "login" ? t.sent : t.sentSignup;
  const usePassword = mode !== "forgot" && method === "password";

  return (
    <div className="w-full">
      {mode !== "forgot" ? (
        <div role="tablist" className="mb-8 grid grid-cols-2 rounded-full border border-line bg-card p-1 text-sm">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => switchTo(m)}
              className={clsx("rounded-full py-2 transition-colors", mode === m ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
            >
              {m === "login" ? t.tabLogin : t.tabSignup}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-8">
          <button type="button" onClick={() => switchTo("login")} className="text-xs text-muted hover:text-ink">
            {t.backToLogin}
          </button>
          <h2 className="mt-4 font-serif text-xl font-bold tracking-wide">{t.forgotTitle}</h2>
          <p className="mt-2 text-sm text-ink-2">{t.forgotLead}</p>
        </div>
      )}

      {mode !== "forgot" && (
        <>
          <button type="button" onClick={google} className="btn btn-primary w-full">
            <svg aria-hidden width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
            {mode === "login" ? t.google : t.googleSignup}
          </button>
          <div className="my-6 flex items-center gap-4 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {t.or}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {mode !== "forgot" && state !== "sent" && (
        <div className="mb-5">
          <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-xl bg-paper-2 p-1 text-xs">
            {(["password", "link"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => {
                  setMethod(m);
                  setError("");
                  setState("idle");
                }}
                className={clsx("rounded-lg py-2 transition-colors", method === m ? "bg-card font-medium text-ink shadow-sm" : "text-muted hover:text-ink")}
              >
                {m === "password" ? t.methodPassword : t.methodLink}
              </button>
            ))}
          </div>
          {method === "link" && <p className="mt-2 text-xs text-muted">{t.linkHint}</p>}
        </div>
      )}

      {state === "sent" ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-line bg-paper-2 p-4 text-sm leading-relaxed">{sentText}</p>
          {waiting && (
            <>
              <p className="flex items-center gap-2 text-xs text-muted">
                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent" />
                {t.waiting}
              </p>
              <form onSubmit={verifyCode} className="space-y-2">
                <label htmlFor="login-code" className="label">
                  {t.codeLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    id="login-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9 ]*"
                    maxLength={12}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="field min-w-0 flex-1 text-center font-display text-xl tracking-[0.4em]"
                    placeholder="000000"
                  />
                  <button type="submit" disabled={verifying || !code.trim()} className="btn btn-primary shrink-0">
                    {verifying ? "…" : t.codeSubmit}
                  </button>
                </div>
                {error && <p className="text-sm text-accent">{error}</p>}
              </form>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {usePassword && mode === "signup" && (
            <Field id="login-name" label={t.name}>
              <input id="login-name" required maxLength={40} autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder={t.namePlaceholder} />
            </Field>
          )}
          <Field id="login-email" label={t.email}>
            <input id="login-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="you@example.com" />
          </Field>
          {usePassword && (
            <Field id="login-password" label={t.password} hint={mode === "signup" ? t.passwordHint : undefined}>
              <input
                id="login-password"
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
              />
            </Field>
          )}
          {usePassword && mode === "signup" && (
            <Field id="login-confirm" label={t.passwordConfirm}>
              <input id="login-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field" />
            </Field>
          )}
          {usePassword && mode === "login" && (
            <div className="text-right">
              <button type="button" onClick={() => switchTo("forgot")} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
                {t.forgot}
              </button>
            </div>
          )}
          <button type="submit" disabled={state === "sending"} className={clsx("btn w-full", mode === "forgot" ? "btn-primary" : "btn-ghost")}>
            {state === "sending"
              ? "…"
              : mode === "forgot"
                ? t.sendReset
                : method === "link"
                  ? mode === "login"
                    ? t.sendLink
                    : t.sendSignup
                  : mode === "login"
                    ? t.submitLogin
                    : t.submitSignup}
          </button>
        </form>
      )}
      {state === "error" && <p className="mt-3 text-sm text-accent">{error}</p>}

      {mode !== "forgot" && (
        <button
          type="button"
          onClick={() => switchTo(mode === "login" ? "signup" : "login")}
          className="mt-8 block w-full text-center text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {mode === "login" ? t.switchToSignup : t.switchToLogin}
        </button>
      )}
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label flex justify-between" htmlFor={id}>
        <span>{label}</span>
        {hint && <span className="text-muted">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

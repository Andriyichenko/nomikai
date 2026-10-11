"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Dict } from "@/lib/i18n";

export default function ResetPasswordForm({ t }: { t: Dict["login"] }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError(t.errShort);
    if (password !== confirm) return setError(t.errMismatch);
    setError("");
    setState("saving");
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setState("idle");
      return;
    }
    setState("done");
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1200);
  };

  if (state === "done") return <p className="rounded-xl border border-line bg-paper-2 p-4 text-sm">{t.resetDone}</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label flex justify-between" htmlFor="new-password">
          <span>{t.password}</span>
          <span className="text-muted">{t.passwordHint}</span>
        </label>
        <input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="new-password-confirm">{t.passwordConfirm}</label>
        <input id="new-password-confirm" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field" />
      </div>
      <button type="submit" disabled={state === "saving"} className="btn btn-primary w-full">
        {state === "saving" ? "…" : t.resetSubmit}
      </button>
      {error && <p className="text-sm text-accent">{error}</p>}
    </form>
  );
}

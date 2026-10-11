"use client";

import { useState, useTransition } from "react";

type R = { ok: true; data?: unknown } | { ok: false; error: string };

/** Runs a server action and keeps a one-line status message for the UI. */
export function useAction() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const run = <T extends R>(fn: () => Promise<T>, okText?: string, after?: (r: T) => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        if (okText) setMsg({ kind: "ok", text: okText });
        after?.(r);
      } else setMsg({ kind: "error", text: r.error });
    });
  return { pending, msg, setMsg, run };
}

export function Msg({ msg }: { msg: { kind: "ok" | "error"; text: string } | null }) {
  if (!msg) return null;
  return <span className={msg.kind === "ok" ? "text-sm text-ok" : "text-sm text-accent"}>{msg.text}</span>;
}

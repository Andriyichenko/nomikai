"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { dictionaries, type Lang } from "@/lib/i18n";
import { openAuthChannel } from "@/lib/auth-sync";

const WAIT_MS = 1200; // how long to wait for the original tab before carrying on here

/**
 * The tab opened by the mail link, already signed in. If the tab the member asked from is still
 * open (same browser), it takes over and this tab just says "you can close me"; otherwise we
 * continue to `next` right here.
 */
export default function AuthDone({ lang, next }: { lang: Lang; next: string }) {
  const t = dictionaries[lang].login;
  const router = useRouter();
  const [handed, setHanded] = useState(false);

  useEffect(() => {
    let acked = false;
    const ch = openAuthChannel((m) => {
      if (m.type !== "ack" || acked) return;
      acked = true;
      setHanded(true);
      window.close(); // only works for script-opened tabs; harmless otherwise
    });
    ch?.postMessage({ type: "signed-in" });
    const timer = window.setTimeout(() => {
      if (!acked) router.replace(next);
    }, ch ? WAIT_MS : 0);
    return () => {
      window.clearTimeout(timer);
      ch?.close();
    };
  }, [next, router]);

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 pb-16 pt-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink">
        <Check size={26} />
      </span>
      <h1 className="mt-6 font-serif text-2xl font-bold tracking-[0.1em]">{t.doneTitle}</h1>
      <p className="mt-3 text-sm text-ink-2">{handed ? t.doneHanded : t.doneRedirecting}</p>
      {handed && (
        <button type="button" onClick={() => router.replace(next)} className="btn btn-ghost mt-8">
          {t.doneContinue}
        </button>
      )}
    </section>
  );
}

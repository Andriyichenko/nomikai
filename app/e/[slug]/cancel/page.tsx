import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWithdraw } from "@/lib/links";
import { getDict } from "@/lib/lang";
import { withdrawByLink } from "./actions";

export const metadata: Metadata = { robots: { index: false } };

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ p?: string; t?: string }> };

/**
 * Confirmation step for the "回答を取り消す" mail link. Opening the link never deletes anything
 * (mail scanners prefetch links); the button posts to withdrawByLink.
 */
export default async function CancelPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { p = "", t: token = "" } = await searchParams;
  const { t } = await getDict();

  const db = createAdminClient();
  const { data: ev } = await db.from("events").select("id, title, status, deadline").eq("slug", slug).maybeSingle();
  if (!ev) notFound();
  const valid = verifyWithdraw(ev.id, p, token);
  const open = ev.status === "open" && !(ev.deadline && new Date(ev.deadline) < new Date());
  const { data: mine } = valid
    ? await db.from("responses").select("event_id").eq("event_id", ev.id).eq("profile_id", p).maybeSingle()
    : { data: null };

  const message = !valid ? t.event.cancelInvalid : !open ? t.event.attendBanner.closed : !mine ? t.event.cancelNone : null;

  return (
    <section className="mx-auto max-w-xl px-4 pb-16 pt-16 md:pt-24">
      <p className="eyebrow">Withdraw</p>
      <h1 className="mt-2 font-serif text-3xl font-bold tracking-[0.08em]">{t.event.cancelTitle}</h1>
      <div className="card mt-8 p-6 md:p-8">
        {message ? (
          <p className="text-ink-2">{message}</p>
        ) : (
          <>
            <p className="font-serif text-lg font-bold leading-relaxed">{t.event.cancelLead(ev.title)}</p>
            <p className="mt-3 text-sm text-ink-2">{t.event.cancelNote}</p>
            <form action={withdrawByLink} className="mt-6">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="p" value={p} />
              <input type="hidden" name="t" value={token} />
              <button type="submit" className="btn btn-accent w-full sm:w-auto sm:px-8">
                {t.event.cancelDo}
              </button>
            </form>
          </>
        )}
        <Link href={`/e/${slug}`} className="mt-5 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink">
          {t.event.cancelBack} →
        </Link>
      </div>
    </section>
  );
}

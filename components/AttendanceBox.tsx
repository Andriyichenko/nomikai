"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check } from "lucide-react";
import { dictionaries, type Lang } from "@/lib/i18n";
import { setAttendance } from "@/app/e/[slug]/actions";
import Avatar from "./Avatar";

/** Who's going to a decided party, plus join / decline for the signed-in member. */
export default function AttendanceBox({
  eventId,
  slug,
  people,
  mine,
  loggedIn,
  canChange,
  lang,
}: {
  eventId: string;
  slug: string;
  people: { name: string; avatar: string | null }[];
  mine: "going" | "declined" | null;
  loggedIn: boolean;
  canChange: boolean;
  lang: Lang;
}) {
  const t = dictionaries[lang].event;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const set = (going: boolean) =>
    start(async () => {
      const r = await setAttendance(eventId, slug, going);
      if (r.ok) router.refresh();
      else setError(r.error);
    });

  return (
    <div className="mt-8 rounded-2xl bg-paper/10 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-wider text-paper/60">
          {t.attendees} — {t.attendeesCount(people.length)}
        </p>
        {mine && (
          <span className={clsx("chip !border-paper/30", mine === "going" ? "!text-paper" : "!text-paper/60")}>
            {mine === "going" && <Check size={12} />} {mine === "going" ? t.youGoing : t.youDeclined}
          </span>
        )}
      </div>
      {people.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {people.map((p, i) => (
            <li key={i} className="flex items-center gap-2 rounded-full bg-paper/10 py-1 pl-1 pr-3 text-sm">
              <Avatar name={p.name} src={p.avatar} size={22} className="!ring-ink" />
              {p.name}
            </li>
          ))}
        </ul>
      )}
      {canChange && (
        <div className="mt-4 flex flex-wrap gap-2">
          {loggedIn ? (
            <>
              {mine !== "going" && (
                <button type="button" disabled={pending} onClick={() => set(true)} className="btn bg-accent text-accent-ink">
                  {t.join}
                </button>
              )}
              {mine !== "declined" && (
                <button type="button" disabled={pending} onClick={() => set(false)} className="btn border border-paper/30 text-paper hover:border-paper">
                  {t.decline}
                </button>
              )}
            </>
          ) : (
            <a href={`/login?next=/e/${slug}`} className="btn bg-accent text-accent-ink">
              {t.join}
            </a>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}

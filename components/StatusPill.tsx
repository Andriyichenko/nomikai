import clsx from "clsx";
import type { Dict } from "@/lib/i18n";
import type { EventStatus } from "@/lib/types";
import { isPast } from "@/lib/format";

export function effectiveStatus(status: EventStatus, deadline: string | null): EventStatus {
  return status === "open" && isPast(deadline) ? "closed" : status;
}

export default function StatusPill({ status, deadline, t }: { status: EventStatus; deadline: string | null; t: Dict["event"] }) {
  const s = effectiveStatus(status, deadline);
  const label = { open: t.open, closed: t.closed, decided: t.decided, draft: t.draft }[s];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs tracking-wider",
        s === "open" && "bg-accent text-accent-ink",
        s === "decided" && "bg-ink text-paper",
        (s === "closed" || s === "draft") && "border border-line text-muted",
      )}
    >
      {s === "open" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {label}
    </span>
  );
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAttend } from "@/lib/links";
import { todayJST } from "@/lib/format";

/**
 * One-click "参加する / 今回は見送る" from the invitation mail. The link is HMAC-signed per
 * (event, member, action), so no login is needed; it only works while the event is decided
 * and has not happened yet.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const profileId = url.searchParams.get("p") ?? "";
  const action = url.searchParams.get("a") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const back = (state: string) => NextResponse.redirect(new URL(`/e/${slug}?attend=${state}`, url.origin), 303);

  if (!["yes", "no"].includes(action)) return back("invalid");
  const db = createAdminClient();
  const { data: ev } = await db.from("events").select("id, status, decided_date").eq("slug", slug).maybeSingle();
  if (!ev || !verifyAttend(ev.id, profileId, action, token)) return back("invalid");
  if (ev.status !== "decided" || !ev.decided_date || ev.decided_date < todayJST()) return back("closed");

  const { error } = await db.from("attendees").upsert({
    event_id: ev.id,
    profile_id: profileId,
    status: action === "yes" ? "going" : "declined",
    source: "invite",
    updated_at: new Date().toISOString(),
  });
  return back(error ? "invalid" : action);
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC-signed one-click links for invitation mails ("参加する" / "今回は見送る"). */
function sign(eventId: string, profileId: string, action: string) {
  const secret = process.env.EMAIL_LINK_SECRET;
  if (!secret) throw new Error("EMAIL_LINK_SECRET is not set");
  return createHmac("sha256", secret).update(`${eventId}:${profileId}:${action}`).digest("base64url");
}

export function attendLink(site: string, slug: string, eventId: string, profileId: string, action: "yes" | "no") {
  const q = new URLSearchParams({ p: profileId, a: action, t: sign(eventId, profileId, action) });
  return `${site}/e/${slug}/attend?${q}`;
}

export function verifyAttend(eventId: string, profileId: string, action: string, token: string) {
  try {
    const a = Buffer.from(sign(eventId, profileId, action));
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

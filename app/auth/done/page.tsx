import type { Metadata } from "next";
import AuthDone from "@/components/AuthDone";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = { robots: { index: false } };

/** Landing tab of an email sign-in link — see components/AuthDone. */
export default async function AuthDonePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const raw = (await searchParams).next ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  return <AuthDone lang={await getLang()} next={next} />;
}

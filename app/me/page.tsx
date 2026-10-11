import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import { getDict } from "@/lib/lang";
import { shortDate } from "@/lib/format";
import { updateName } from "./actions";

export const metadata = { title: "My page" };

export default async function MePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/me");
  const { lang, t } = await getDict();
  const profile = viewer.profile;

  const supabase = await createClient();
  const { data: history } = profile
    ? await supabase
        .from("responses")
        .select("dates, shop_ids, updated_at, events(slug, title, status)")
        .eq("profile_id", profile.id)
        .order("updated_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 md:px-8 md:pt-20">
      <p className="eyebrow">Profile</p>
      <div className="mt-4 flex items-center gap-4">
        <Avatar name={profile?.display_name ?? ""} src={profile?.avatar_url} size={56} />
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide">{profile?.display_name}</h1>
          <p className="text-xs text-muted">{profile?.email}</p>
        </div>
      </div>

      <form action={updateName} className="mt-10 max-w-md">
        <label className="label" htmlFor="display_name">{t.me.name}</label>
        <div className="flex gap-2">
          <input id="display_name" name="display_name" defaultValue={profile?.display_name} maxLength={40} required className="field" />
          <button className="btn btn-primary shrink-0">{t.me.save}</button>
        </div>
        <p className="mt-2 text-xs text-muted">{t.me.nameHint}</p>
      </form>

      <section className="mt-16">
        <h2 className="eyebrow mb-4">{t.me.history}</h2>
        <ul className="divide-y divide-line border-y border-line">
          {(history ?? []).map((h, i) => {
            const ev = h.events as unknown as { slug: string; title: string } | null;
            if (!ev) return null;
            return (
              <li key={i}>
                <Link href={`/e/${ev.slug}`} className="flex items-center justify-between gap-4 py-4 hover:text-accent">
                  <span className="font-serif font-bold">{ev.title}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {(h.dates as string[]).slice(0, 3).map((d) => shortDate(d, lang)).join(" ")}
                    {(h.dates as string[]).length > 3 && " …"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <form action="/auth/signout" method="post" className="mt-16">
        <button className="text-sm text-muted underline underline-offset-4 hover:text-accent">{t.nav.logout}</button>
      </form>
    </div>
  );
}

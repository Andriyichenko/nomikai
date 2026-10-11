import Link from "next/link";
import { Star } from "lucide-react";
import ShopImporter from "@/components/admin/ShopImporter";
import ShopLogo from "@/components/ShopLogo";
import { createClient } from "@/lib/supabase/server";
import { SOURCE_LABEL } from "@/lib/shop-utils";
import type { Shop } from "@/lib/types";

export default async function AdminShops() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("id, name, genre, budget, logo_url, rating, source, event_shops(count)")
    .order("created_at", { ascending: false });
  const shops = (data ?? []) as (Pick<Shop, "id" | "name" | "genre" | "budget" | "logo_url" | "rating" | "source"> & {
    event_shops: { count: number }[];
  })[];

  return (
    <div className="space-y-12">
      <ShopImporter />
      <section>
        <h2 className="eyebrow mb-4">登録済みのお店（{shops.length}）</h2>
        <ul className="divide-y divide-line border-y border-line">
          {shops.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/shops/${s.id}`} className="flex items-center gap-4 py-4 hover:bg-paper-2/50">
                <ShopLogo shop={s} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted">{[s.genre, s.budget].filter(Boolean).join(" ・ ")}</p>
                </div>
                <div className="hidden shrink-0 items-center gap-3 text-xs text-muted sm:flex">
                  {s.rating != null && <span className="inline-flex items-center gap-1"><Star size={12} className="fill-accent text-accent" />{Number(s.rating).toFixed(2)}</span>}
                  {SOURCE_LABEL[s.source] && <span className="chip">{SOURCE_LABEL[s.source]}</span>}
                  <span>{s.event_shops?.[0]?.count ?? 0}会</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

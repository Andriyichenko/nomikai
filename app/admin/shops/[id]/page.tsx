import Link from "next/link";
import { notFound } from "next/navigation";
import ShopEditor from "@/components/admin/ShopEditor";
import { createClient } from "@/lib/supabase/server";
import type { Shop } from "@/lib/types";

export default async function AdminShop({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const { id: _id, ...draft } = data as Shop & { created_at?: string; updated_at?: string };
  delete (draft as Record<string, unknown>).created_at;
  delete (draft as Record<string, unknown>).updated_at;
  return (
    <div>
      <Link href="/admin/shops" className="text-sm text-muted hover:text-ink">← お店一覧</Link>
      <h2 className="mb-8 mt-4 font-serif text-2xl font-bold tracking-wide">{data.name}</h2>
      <ShopEditor id={_id} initial={draft} />
    </div>
  );
}

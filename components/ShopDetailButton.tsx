"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import { dictionaries, type Lang } from "@/lib/i18n";
import type { Shop } from "@/lib/types";
import ShopSheet from "./ShopSheet";

/** Opens the full shop sheet (photos, menu, reviews, map) for the decided shop. */
export default function ShopDetailButton({ shop, lang, className }: { shop: Shop; lang: Lang; className?: string }) {
  const [open, setOpen] = useState(false);
  const t = dictionaries[lang].event;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Store size={16} /> {t.shopDetails}
      </button>
      <ShopSheet shop={open ? shop : null} t={t} onClose={() => setOpen(false)} />
    </>
  );
}

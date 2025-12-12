"use client";

import { usePathname } from "next/navigation";
import { translations, Language, Translation } from "@/lib/i18n/translations";

export function useTranslation() {
  const pathname = usePathname();
  const lang: Language = pathname?.startsWith("/cn") ? "cn" : "ja";

  return {
    t: translations[lang],
    lang
  };
}

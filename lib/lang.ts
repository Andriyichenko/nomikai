import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, dictionaries, type Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return value === "zh" ? "zh" : "ja";
}

export async function getDict() {
  const lang = await getLang();
  return { lang, t: dictionaries[lang] };
}

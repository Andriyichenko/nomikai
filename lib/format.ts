import type { Lang } from "./i18n";
import { dictionaries } from "./i18n";

const TZ = "Asia/Tokyo";

/** Parse a YYYY-MM-DD date without timezone drift. */
function day(d: string) {
  return new Date(`${d}T00:00:00Z`);
}

export function weekday(d: string, lang: Lang) {
  return dictionaries[lang].common.weekday[day(d).getUTCDay()];
}

export function isWeekend(d: string) {
  const w = day(d).getUTCDay();
  return w === 0 || w === 6;
}

/** "6/13（土）" */
export function shortDate(d: string, lang: Lang) {
  const x = day(d);
  return `${x.getUTCMonth() + 1}/${x.getUTCDate()}（${weekday(d, lang)}）`;
}

/** "2026年6月13日（土）" */
export function longDate(d: string, lang: Lang) {
  const x = day(d);
  return `${x.getUTCFullYear()}年${x.getUTCMonth() + 1}月${x.getUTCDate()}日（${weekday(d, lang)}）`;
}

export function monthKey(d: string) {
  return d.slice(0, 7);
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${y}.${m}`;
}

export function deadlineLabel(iso: string, lang: Lang = "ja") {
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "ja-JP", {
    timeZone: TZ,
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Remaining time until the deadline, coarse: "3日" / "5時間" / "12分". */
export function remaining(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return null;
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}時間`;
  return `${Math.floor(h / 24)}日`;
}

export function isPast(iso: string | null) {
  return iso ? new Date(iso).getTime() < Date.now() : false;
}

/** Enumerate YYYY-MM-DD strings from start to end inclusive. */
export function dateRange(start: string, end: string) {
  const out: string[] = [];
  for (let x = day(start); x <= day(end); x.setUTCDate(x.getUTCDate() + 1)) {
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

export function todayJST() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

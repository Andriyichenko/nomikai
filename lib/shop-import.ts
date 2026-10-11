import "server-only";
import * as cheerio from "cheerio";
import type { MenuItem, Review, ShopDraft } from "./types";

/**
 * Turns a pasted 食べログ / ホットペッパー link (or the whole text of a share sheet)
 * into a shop draft. Both sites embed schema.org `Restaurant` JSON-LD (name, image,
 * address, geo, rating, a few reviews); the rest is scraped from the info table and
 * the menu page. Only these hosts are fetched, so the importer can't be used to make
 * the server request arbitrary URLs.
 */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const MAX_MENU = 40;
const MAX_REVIEWS = 5;
const MAX_PHOTOS = 12;
const REVIEW_CHARS = 180;

type Source = "tabelog" | "hotpepper";

export class ImportError extends Error {}

/** Pull the first http(s) URL out of whatever was pasted. */
export function extractUrl(input: string) {
  const m = input.match(/https?:\/\/[^\s"'<>）)]+/);
  return m ? m[0] : null;
}

/** Canonical shop root URL, or null if the link is not a supported shop page. */
export function normalizeShopUrl(raw: string): { source: Source; url: string } | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (host === "tabelog.com" || host === "s.tabelog.com" || host === "www.tabelog.com") {
    // /{pref}/A1234/A123456/12345678/... (s.tabelog.com shares the same path)
    const m = u.pathname.match(/^\/([a-z]+\/A\d+\/A\d+\/\d+)\//) ?? u.pathname.match(/^\/([a-z]+\/A\d+\/A\d+\/\d+)$/);
    return m ? { source: "tabelog", url: `https://tabelog.com/${m[1]}/` } : null;
  }
  if (host === "www.hotpepper.jp" || host === "hotpepper.jp") {
    const m = u.pathname.match(/\/str(J\d+)/i);
    return m ? { source: "hotpepper", url: `https://www.hotpepper.jp/str${m[1].toUpperCase()}/` } : null;
  }
  return null;
}

async function fetchHtml(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, "accept-language": "ja,en;q=0.8" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new ImportError(`ページを取得できませんでした（HTTP ${res.status}）`);
    return await res.text();
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError("ページの取得がタイムアウトしました。時間をおいて再度お試しください。");
  } finally {
    clearTimeout(timer);
  }
}

const clean = (s: string | undefined | null) =>
  (s ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/　/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();

const oneLine = (s: string | undefined | null) => clean(s).replace(/\n+/g, " ");

/** Sites print "－" / "-" for empty fields. */
const orEmpty = (s: string) => (/^[\s\-－ー—]*$/.test(s) ? "" : s);

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

type LdRestaurant = {
  name?: string;
  image?: string | string[];
  servesCuisine?: string;
  priceRange?: string;
  telephone?: string;
  address?: { addressRegion?: string; addressLocality?: string; streetAddress?: string };
  geo?: { latitude?: string | number; longitude?: string | number };
  aggregateRating?: { ratingValue?: string; ratingCount?: string; reviewCount?: string };
  review?: { author?: { name?: string }; reviewBody?: string; datePublished?: string; reviewRating?: { ratingValue?: string } }[];
};

function readJsonLd($: cheerio.CheerioAPI): LdRestaurant | null {
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    try {
      const data = JSON.parse($(el).text());
      const list = Array.isArray(data) ? data : [data];
      const hit = list.find((d) => d?.["@type"] === "Restaurant");
      if (hit) return hit as LdRestaurant;
    } catch {
      // ignore malformed blocks
    }
  }
  return null;
}

/** Map of <th> label → <td> text for the shop info tables. */
function infoTable($: cheerio.CheerioAPI) {
  const map = new Map<string, string>();
  $("table tr").each((_, tr) => {
    const th = oneLine($(tr).find("th").first().text());
    const td = $(tr).find("td").first();
    if (!th || !td.length || map.has(th)) return;
    td.find("script, style").remove();
    td.find("br").replaceWith("\n");
    map.set(th, clean(td.text()));
  });
  return map;
}

function fromJsonLd(ld: LdRestaurant | null): Partial<ShopDraft> {
  if (!ld) return {};
  const a = ld.address ?? {};
  const img = Array.isArray(ld.image) ? ld.image[0] : ld.image;
  const rating = Number(ld.aggregateRating?.ratingValue);
  const count = Number(ld.aggregateRating?.ratingCount ?? ld.aggregateRating?.reviewCount);
  const reviews: Review[] = (ld.review ?? []).slice(0, MAX_REVIEWS).map((r) => ({
    author: oneLine(r.author?.name) || "—",
    rating: r.reviewRating?.ratingValue ? Number(r.reviewRating.ratingValue) : null,
    body: truncate(oneLine(r.reviewBody), REVIEW_CHARS),
    date: r.datePublished,
  }));
  const lat = Number(ld.geo?.latitude);
  const lng = Number(ld.geo?.longitude);
  return {
    name: oneLine(ld.name),
    cover_url: img && !/no_?photo/i.test(img) ? img : null,
    genre: oneLine(ld.servesCuisine),
    budget: oneLine(ld.priceRange),
    phone: oneLine(ld.telephone),
    address: [a.addressRegion, a.addressLocality, a.streetAddress].map(oneLine).join(""),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    rating: Number.isFinite(rating) && rating > 0 ? rating : null,
    review_count: Number.isFinite(count) && count > 0 ? count : null,
    reviews,
  };
}

async function importTabelog(url: string): Promise<ShopDraft> {
  const [html, menuHtml] = await Promise.all([fetchHtml(url), fetchHtml(`${url}dtlmenu/`).catch(() => "")]);
  const $ = cheerio.load(html);
  const ld = fromJsonLd(readJsonLd($));
  const info = infoTable($);

  const photos = $(".rstdtl-top-postphoto__photo a[href]")
    .map((_, a) => $(a).attr("href") ?? "")
    .get()
    .filter((u) => /^https:\/\/tblg\.k-img\.com\//.test(u));

  const prTitle = oneLine($(".pr-comment-title").first().text());
  const prBody = oneLine($(".pr-comment__first").first().text()).replace(/\s*\.\.\.\s*続きを読む.*$/, "");
  const summary = [prTitle, prBody && prBody !== prTitle ? prBody : ""].filter(Boolean).join("\n");

  const menu: MenuItem[] = [];
  $(".rstdtl-course-list__inner").each((_, el) => {
    const name = oneLine($(el).find(".rstdtl-course-list__course-title-text").text());
    const price = oneLine($(el).find(".rstdtl-course-list__price-num").first().text()).match(/[\d,]+/)?.[0];
    if (name) menu.push({ name: truncate(name, 80), price: price ? `${price}円` : "", note: "コース" });
  });
  if (menuHtml) {
    const $m = cheerio.load(menuHtml);
    $m(".rstdtl-menu-lst__contents").each((_, el) => {
      const name = oneLine($m(el).find(".rstdtl-menu-lst__menu-title").text());
      const price = oneLine($m(el).find(".rstdtl-menu-lst__price").text());
      const note = oneLine($m(el).find(".rstdtl-menu-lst__ex").text());
      if (name) menu.push({ name, price, note: truncate(note, 80) });
    });
  }

  return finalize({
    ...ld,
    photos,
    source: "tabelog",
    source_url: url,
    summary,
    budget: orEmpty(oneLine(info.get("予算"))) || orEmpty(ld.budget ?? ""),
    access: clean(info.get("交通手段")).replace(/\n+/g, " / "),
    hours: clean(info.get("営業時間")).split("\n").slice(0, 6).join("\n"),
    phone: ld.phone || oneLine(info.get("電話番号")),
    menu,
  });
}

async function importHotpepper(url: string): Promise<ShopDraft> {
  const [html, foodHtml] = await Promise.all([fetchHtml(url), fetchHtml(`${url}food/`).catch(() => "")]);
  const $ = cheerio.load(html);
  if (/掲載情報なし/.test($("title").text())) throw new ImportError("ホットペッパーに掲載されていないお店です。");
  const ld = fromJsonLd(readJsonLd($));
  const info = infoTable($);

  const logo = $(".shopHeaderLogo img").attr("src") ?? null;
  const photos = (html.match(/https:\/\/imgfp\.hotp\.jp\/IMGH\/[^"'\s]+?_480\.jpg/g) ?? []).filter((u) => u !== logo);
  const catchCopy = oneLine($(".shopHeaderGenreCatchInner").first().text());
  const ogDesc = oneLine($('meta[property="og:description"]').attr("content"))
    .replace(/^.*?【ホットペッパーグルメ】！?/, "")
    .replace(/※この店舗は.*$/, "")
    .replace(/^.*グルメ情報満載です！?$/, "");
  const summary = [catchCopy, ogDesc].filter(Boolean).join("\n");

  const menu: MenuItem[] = [];
  if (foodHtml) {
    const $f = cheerio.load(foodHtml);
    $f(".menuList li").each((_, el) => {
      const name = oneLine($f(el).find(".title").text());
      const price = oneLine($f(el).find(".price").text()).replace(/（税込）/, "");
      const note = oneLine($f(el).find(".text").text());
      if (name) menu.push({ name, price, note: truncate(note, 80) });
    });
  }

  return finalize({
    ...ld,
    name: ld.name || oneLine($("h1.shopName").text()),
    photos,
    source: "hotpepper",
    source_url: url,
    logo_url: logo,
    summary,
    budget: orEmpty(oneLine(info.get("予算詳細"))) || orEmpty(ld.budget ?? ""),
    access: orEmpty(oneLine(info.get("アクセス"))),
    hours: clean(info.get("営業時間")).split("\n").slice(0, 4).join("\n"),
    menu,
  });
}

function finalize(d: Partial<ShopDraft>): ShopDraft {
  if (!d.name) throw new ImportError("お店の情報を読み取れませんでした。URLを確認してください。");
  return {
    name: d.name,
    genre: d.genre ?? "",
    summary: d.summary ?? "",
    logo_url: d.logo_url ?? null,
    cover_url: d.cover_url ?? null,
    budget: d.budget ?? "",
    address: d.address ?? "",
    access: d.access ?? "",
    hours: d.hours ?? "",
    phone: d.phone ?? "",
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    rating: d.rating ?? null,
    review_count: d.review_count ?? null,
    reviews: d.reviews ?? [],
    menu: (d.menu ?? []).slice(0, MAX_MENU),
    photos: [...new Set(d.photos ?? [])].slice(0, MAX_PHOTOS),
    source: d.source ?? "manual",
    source_url: d.source_url ?? null,
  };
}

export async function importShop(input: string): Promise<ShopDraft> {
  const raw = extractUrl(input.trim());
  if (!raw) throw new ImportError("URLが見つかりません。食べログかホットペッパーのお店のリンクを貼ってください。");
  const target = normalizeShopUrl(raw);
  if (!target) {
    throw new ImportError("対応しているのは食べログ（tabelog.com）とホットペッパー（hotpepper.jp）のお店ページです。");
  }
  return target.source === "tabelog" ? importTabelog(target.url) : importHotpepper(target.url);
}

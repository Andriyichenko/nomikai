// One-off: turn the legacy export (scripts/export-legacy.mjs, v1 Prisma/Neon) into SQL for the v2 schema.
// Usage: ADMIN_EMAIL=you@example.com node scripts/legacy-to-sql.mjs legacy.json > legacy.sql
//
// - Users → profiles (no auth user yet; they are claimed on first sign-in with the same email).
// - The legacy reservation project → a closed event with its shop as the only candidate,
//   candidate dates = every date anyone picked. Reservations → responses.
// - Archive (DB rows + the photos hard-coded in the old archive page) → archive_entries.
// - Old hero copy → an inactive tagline; notice and brand → site_settings.
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: legacy-to-sql.mjs <legacy.json>");
  process.exit(1);
}
const d = JSON.parse(readFileSync(file, "utf8"));
const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (xs, type) => `array[${xs.map(q).join(", ")}]::${type}[]`;
// Deterministic ids so the script can be re-run safely.
const uid = (key) => `md5(${q(key)})::uuid`;
const out = [];

out.push("begin;");
out.push("alter table public.responses disable trigger responses_validate; -- historical rows are for a closed event");

// --- profiles
const SKIP = new Set(["admin@example.com"]); // seed account from the old system, not a real person
const users = d.users.filter((u) => u.email && !SKIP.has(u.email.toLowerCase()));
for (const u of users) {
  const name = u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email.split("@")[0];
  const avatar = u.image && (u.image.startsWith("http") || u.image.startsWith("/uploads/")) ? u.image : null;
  const isAdmin = u.role === "admin" || u.email.toLowerCase() === adminEmail;
  out.push(
    `insert into public.profiles (id, email, display_name, avatar_url, is_admin, legacy_id, created_at) values (` +
      `${uid(`user:${u.id}`)}, ${q(u.email.toLowerCase())}, ${q(name)}, ${q(avatar)}, ${isAdmin}, ${q(u.id)}, ${q(u.createdAt)}) ` +
      `on conflict (email) do update set legacy_id = excluded.legacy_id, is_admin = public.profiles.is_admin or excluded.is_admin;`,
  );
}
if (adminEmail && !users.some((u) => u.email.toLowerCase() === adminEmail)) {
  out.push(
    `insert into public.profiles (email, display_name, is_admin) values (${q(adminEmail)}, ${q(adminEmail.split("@")[0])}, true) ` +
      `on conflict (email) do update set is_admin = true;`,
  );
}

// --- reservation projects → events (+ their shop)
for (const item of d.reservationItems) {
  // The old system sometimes stored several rows per person; insert oldest→newest and let the newest win.
  const rs = d.reservations
    .filter((r) => r.reservationItemId === item.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const picked = new Set();
  for (const r of rs) for (const x of JSON.parse(r.availableDates || "[]")) picked.add(x);
  const dates = [...picked].sort();
  const eventId = uid(`event:${item.id}`);
  const shopId = uid(`shop:${item.id}`);
  const slug = `legacy-${(item.createdAt || "").slice(0, 7) || "event"}`;
  const deadline = item.deadline ? `${item.deadline}T23:59:00+09:00` : null;

  if (item.shopName) {
    out.push(
      `insert into public.shops (id, name, address, source) values (${shopId}, ${q(item.shopName)}, ${q(item.location)}, 'manual') on conflict (id) do nothing;`,
    );
  }
  out.push(
    `insert into public.events (id, slug, title, description, area, start_time, dates, deadline, status, legacy_id, created_at) values (` +
      `${eventId}, ${q(slug)}, ${q(item.title)}, ${q(item.description ?? "")}, ${q(item.location ?? "")}, ${q(item.startTime ?? "")}, ` +
      `${arr(dates, "date")}, ${q(deadline)}, 'closed', ${q(item.id)}, ${q(item.createdAt)}) on conflict (id) do nothing;`,
  );
  if (item.shopName) {
    out.push(`insert into public.event_shops (event_id, shop_id, position) values (${eventId}, ${shopId}, 0) on conflict do nothing;`);
  }
  for (const r of rs) {
    if (!r.userId || !users.some((u) => u.id === r.userId)) continue;
    const rd = JSON.parse(r.availableDates || "[]").sort();
    out.push(
      `insert into public.responses (event_id, profile_id, shop_ids, dates, comment, created_at, updated_at) ` +
        `select ${eventId}, p.id, ${item.shopName ? `array[${shopId}]` : "'{}'::uuid[]"}, ${arr(rd, "date")}, ${q(r.message ?? "")}, ${q(r.createdAt)}, ${q(r.createdAt)} ` +
        `from public.profiles p where p.legacy_id = ${q(r.userId)} ` +
        `on conflict (event_id, profile_id) do update set dates = excluded.dates, comment = excluded.comment, updated_at = excluded.updated_at;`,
    );
  }
}

// --- archive
const hardcoded = [
  { id: "2025-01", title: "2025年 新年会", date: "2025-01-18", location: "大阪西成区 中華居酒屋", description: "2025年の幕開けを祝う新年会を開催しました。久しぶりの再会で話が尽きず、あっという間の3時間でした。", images: ["/25_1.jpg"] },
  { id: "2025-03", title: "2025年 3月飲み会", date: "2025-03-29", location: "大阪梅田 絆鳥居酒屋", description: "春の飲み会！桜の季節に合わせて開催。", images: ["/25_3_1.JPG", "/25_3_2.JPG", "/25_3_3.JPG", "/25_3_4.JPG"] },
];
const archive = [
  ...hardcoded,
  ...d.events.map((e) => ({ ...e, images: JSON.parse(e.images || "[]") })),
];
archive.forEach((a, i) => {
  out.push(
    `insert into public.archive_entries (id, title, held_on, place, body, images, position) values (` +
      `${uid(`archive:${a.id}`)}, ${q(a.title)}, ${q(a.date)}, ${q(a.location ?? "")}, ${q(a.description ?? "")}, ${arr(a.images, "text")}, ${i}) on conflict (id) do nothing;`,
  );
});

// --- copy: taglines + settings
const c = d.siteConfig[0];
out.push(
  `insert into public.taglines (id, line_ja, line_zh, caption_ja, caption_zh, is_active, position) values (` +
    `${uid("tagline:default")}, '一緒に、いい夜を。', '一起，过个好夜晚。', 'お店も日程も、みんなで決めよう。', '店和日子，大家一起定。', true, 0) on conflict (id) do nothing;`,
);
if (c) {
  out.push(
    `insert into public.taglines (id, line_ja, line_zh, caption_ja, caption_zh, is_active, position) values (` +
      `${uid("tagline:legacy")}, ${q(c.heroTitle)}, ${q(c.heroTitleCn)}, ${q(c.heroSubtitle)}, ${q(c.heroSubtitleCn)}, false, 1) on conflict (id) do nothing;`,
  );
  out.push(`update public.site_settings set brand = ${q(c.mainTitle)}, brand_sub = ${q(c.subTitle)} where id = 1;`);
}
const notice = [...d.notices].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
if (notice) {
  out.push(
    `update public.site_settings set notice_title = ${q(notice.title)}, notice_body = ${q(notice.content)}, notice_updated_at = ${q(notice.updatedAt)} where id = 1;`,
  );
}

out.push("alter table public.responses enable trigger responses_validate;");
out.push("commit;");
console.log(out.join("\n"));

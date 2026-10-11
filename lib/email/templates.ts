import "server-only";

/**
 * Notification mails in the site's look (paper background, white card, vermilion square,
 * Mincho headings, black pill button) — same layout as supabase/templates/*.html.
 * Everything is inline-styled, table-based HTML so it renders in Gmail / Apple Mail / Outlook.
 */

const SERIF = "'Shippori Mincho','Hiragino Mincho ProN','Yu Mincho','YuMincho','Songti SC',serif";
const SANS = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic','PingFang SC',sans-serif";
const C = { paper: "#f5f2eb", card: "#fbf9f5", ink: "#171614", ink2: "#4a4741", muted: "#8b867c", line: "#d9d3c7", accent: "#c23a2b" };

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nl2br = (s: string) => esc(s).replace(/\n/g, "<br>");

type Button = { label: string; href: string; ghost?: boolean };
type Row = { label: string; value: string; html?: boolean };

type Layout = {
  brand: string;
  eyebrow: string;
  title: string; // may contain <br>
  lead: string; // may contain <br>
  rows?: Row[];
  note?: string; // free text from the organiser (escaped)
  buttons?: Button[];
  tips?: string[];
  ps?: string;
  zh?: string;
  footerUrl: string;
};

function button(b: Button) {
  const bg = b.ghost ? "transparent" : C.ink;
  const fg = b.ghost ? C.ink : C.paper;
  const border = b.ghost ? `border:1.5px solid ${C.ink};` : "";
  return `<td style="padding:0 10px 10px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="${b.ghost ? C.card : C.ink}" style="border-radius:999px;${border}background:${bg};">
<a href="${esc(b.href)}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:14px;font-weight:700;letter-spacing:.06em;color:${fg};text-decoration:none;border-radius:999px;">${esc(b.label)} &rarr;</a>
</td></tr></table></td>`;
}

export function layout(l: Layout) {
  const rows = (l.rows ?? [])
    .filter((r) => r.value)
    .map(
      (r) => `<tr>
<td valign="top" style="padding:9px 12px 9px 0;width:84px;font-family:${SANS};font-size:12px;color:${C.muted};white-space:nowrap;">${esc(r.label)}</td>
<td valign="top" style="padding:9px 0;font-family:${SANS};font-size:14px;line-height:1.7;color:${C.ink};">${r.html ? r.value : nl2br(r.value)}</td>
</tr>`,
    )
    .join(`<tr><td colspan="2" style="border-top:1px solid ${C.line};font-size:0;line-height:0;">&nbsp;</td></tr>`);
  const tips = (l.tips ?? [])
    .map(
      (t, i) => `<tr><td style="padding:0 0 8px;font-family:${SANS};font-size:13px;line-height:1.8;color:${C.ink2};">
<span style="display:inline-block;width:24px;font-family:Georgia,serif;color:${C.accent};">${String(i + 1).padStart(2, "0")}</span>${t}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<title>${esc(l.title.replace(/<br>/g, ""))}</title></head>
<body style="margin:0;padding:0;background:${C.paper};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};"><tr><td align="center" style="padding:36px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;">
<tr><td style="padding:0 4px 24px;font-family:${SERIF};font-size:14px;font-weight:700;letter-spacing:.14em;color:${C.ink};">${esc(l.brand)}</td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:20px;padding:36px 28px 30px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:0 0 20px;"><div style="width:12px;height:12px;background:${C.accent};font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr><td style="padding:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:.24em;color:${C.muted};text-transform:uppercase;">${esc(l.eyebrow)}</td></tr>
<tr><td style="padding:0 0 16px;font-family:${SERIF};font-size:25px;line-height:1.45;font-weight:700;letter-spacing:.05em;color:${C.ink};">${l.title}</td></tr>
<tr><td style="padding:0 0 22px;font-family:${SANS};font-size:14px;line-height:1.9;color:${C.ink2};">${l.lead}</td></tr>
${rows ? `<tr><td style="padding:0 0 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};">${rows}</table></td></tr>` : ""}
${l.note ? `<tr><td style="padding:0 0 22px;"><div style="border-left:3px solid ${C.accent};padding:4px 0 4px 14px;font-family:${SANS};font-size:14px;line-height:1.8;color:${C.ink2};">${nl2br(l.note)}</div></td></tr>` : ""}
${l.buttons?.length ? `<tr><td style="padding:0 0 18px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${l.buttons.map(button).join("")}</tr></table></td></tr>` : ""}
${tips ? `<tr><td style="border-top:1px solid ${C.line};padding:20px 0 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${tips}</table></td></tr>` : ""}
${l.ps ? `<tr><td style="padding:10px 0 0;font-family:${SANS};font-size:12px;line-height:1.8;color:${C.muted};">${l.ps}</td></tr>` : ""}
</table></td></tr>
${l.zh ? `<tr><td style="padding:20px 8px 0;font-family:${SANS};font-size:12px;line-height:1.8;color:${C.muted};">${l.zh}</td></tr>` : ""}
<tr><td style="padding:14px 8px 0;font-family:${SANS};font-size:11px;line-height:1.8;color:#a8a296;">
このメールは <a href="${esc(l.footerUrl)}" style="color:${C.muted};">${esc(l.footerUrl.replace(/^https?:\/\//, ""))}</a> から自動で送信されています。<br>&mdash; バース人材 飲み会係</td></tr>
</table></td></tr></table></body></html>`;
}

/** Plain-text twin for clients that do not render HTML. */
export function plain(parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------

type EventInfo = { title: string; url: string };
type ShopInfo = { name: string; address?: string; mapUrl?: string };

/** 1) Sent right after someone submits or updates their answer. */
export function responseMail(p: {
  brand: string;
  name: string;
  event: EventInfo;
  shops: string[];
  dates: string[];
  comment: string;
  deadline: string;
  updated: boolean;
  site: string;
}) {
  const subject = `【${p.updated ? "回答更新" : "回答受付"}】${p.event.title}`;
  const title = p.updated ? "回答を更新しました。<br>気が変わるのも、飲み会の醍醐味。" : "回答、たしかに<br>受け取りました。";
  const html = layout({
    brand: p.brand,
    eyebrow: p.updated ? "Updated" : "Received",
    title,
    lead: `${esc(p.name)} さん、ありがとうございます。<br>幹事の机に、あなたの一票がそっと置かれました。`,
    rows: [
      { label: "会", value: p.event.title },
      { label: "行きたい店", value: p.shops.join("\n") || "—" },
      { label: "行ける日", value: p.dates.join("、") || "—" },
      { label: "ひとこと", value: p.comment },
      { label: "締切", value: p.deadline },
    ],
    buttons: [{ label: "回答を見る・変更する", href: p.event.url }],
    tips: [
      "締切までは何度でも変更OK。迷ったら、とりあえず全部の日に◯を。",
      "日程とお店が決まったら、またメールでお知らせします。",
    ],
    ps: "※ 回答するたびにこのメールが届きます。届かなくなったら、たぶん迷惑メールフォルダで寝ています。",
    zh: `【中文】已收到你的回答！截止前可以随时修改。日期和店铺确定后会再发邮件通知你。`,
    footerUrl: p.site,
  });
  const text = plain([
    `${p.name} さん`,
    `「${p.event.title}」への回答を${p.updated ? "更新" : "受け付け"}ました。`,
    "",
    `行きたい店: ${p.shops.join("、") || "—"}`,
    `行ける日: ${p.dates.join("、") || "—"}`,
    p.comment && `ひとこと: ${p.comment}`,
    p.deadline && `締切: ${p.deadline}`,
    "",
    `回答の確認・変更: ${p.event.url}`,
  ]);
  return { subject, html, text };
}

type Decided = {
  brand: string;
  name: string;
  event: EventInfo;
  when: string; // "2026年11月14日（土） 19:00〜"
  shop: ShopInfo | null;
  budget: string;
  note: string;
  icsUrl: string;
  site: string;
};

const decidedRows = (p: Decided): Row[] => [
  { label: "日時", value: p.when },
  { label: "お店", value: p.shop?.name ?? "" },
  { label: "住所", value: p.shop?.address ?? "" },
  { label: "予算", value: p.budget },
];

/** 2a) The decided date is one the person picked — they're in. */
export function decidedGoingMail(p: Decided) {
  const subject = `【決定】${p.event.title} — ${p.when}`;
  const html = layout({
    brand: p.brand,
    eyebrow: "Confirmed",
    title: "決まりました。<br>あとは乾杯するだけ。",
    lead: `${esc(p.name)} さんが「行ける」と言ってくれた日に、無事決定しました。<br>参加メンバーとして登録済みです。`,
    rows: decidedRows(p),
    note: p.note,
    buttons: [
      ...(p.shop?.mapUrl ? [{ label: "地図を開く", href: p.shop.mapUrl }] : []),
      { label: "カレンダーに追加", href: p.icsUrl, ghost: true },
    ],
    tips: [
      "当日の朝に、もう一度メールでお知らせします。",
      `都合が悪くなったら <a href="${esc(p.event.url)}" style="color:${C.accent};">会のページ</a> から「今回は見送る」へ。`,
    ],
    ps: "※ 遅刻の言い訳は、乾杯までに考えておいてください。",
    zh: `【中文】确定啦！就在你说能来的那天。当天早上还会再提醒你一次。`,
    footerUrl: p.site,
  });
  const text = plain([
    `${p.name} さん`,
    `「${p.event.title}」の日程とお店が決まりました。`,
    "",
    `日時: ${p.when}`,
    p.shop && `お店: ${p.shop.name}`,
    p.shop?.address && `住所: ${p.shop.address}`,
    p.budget && `予算: ${p.budget}`,
    p.note && `\n${p.note}`,
    "",
    p.shop?.mapUrl && `地図: ${p.shop.mapUrl}`,
    `カレンダー: ${p.icsUrl}`,
    `会のページ: ${p.event.url}`,
  ]);
  return { subject, html, text };
}

/** 2b) The decided date isn't one they picked — invite them to join anyway. */
export function decidedInviteMail(p: Decided & { joinUrl: string; declineUrl: string }) {
  const subject = `【お誘い】${p.event.title} は ${p.when} に決まりました`;
  const html = layout({
    brand: p.brand,
    eyebrow: "Invitation",
    title: "日程が決まりました。<br>この日、合流しませんか？",
    lead: `${esc(p.name)} さんが選んでくれた日とは別の日になりました。<br>でも、もし都合がつくなら大歓迎です。ボタンひとつで返事できます。`,
    rows: decidedRows(p),
    note: p.note,
    buttons: [
      { label: "参加する", href: p.joinUrl },
      { label: "今回は見送る", href: p.declineUrl, ghost: true },
    ],
    tips: ["ログインは不要です。押した瞬間に幹事へ伝わります。", "あとから気が変わっても、もう一度押し直せばOK。"],
    ps: "※ 見送っても、次の会でまた誘います。忍びのように、しつこく。",
    zh: `【中文】聚会日期定了，虽然不是你选的那天——要不要来？点「参加する」即可报名，不用登录。`,
    footerUrl: p.site,
  });
  const text = plain([
    `${p.name} さん`,
    `「${p.event.title}」の日程が決まりました（選んでくれた日とは別の日です）。`,
    "",
    `日時: ${p.when}`,
    p.shop && `お店: ${p.shop.name}`,
    p.shop?.address && `住所: ${p.shop.address}`,
    p.note && `\n${p.note}`,
    "",
    `参加する: ${p.joinUrl}`,
    `今回は見送る: ${p.declineUrl}`,
  ]);
  return { subject, html, text };
}

/** 3) Morning-of reminder for everyone going. */
export function dayOfMail(p: Decided & { access: string }) {
  const subject = `【本日】${p.event.title} — ${p.when}`;
  const html = layout({
    brand: p.brand,
    eyebrow: "Today",
    title: `今日です。<br>${esc(p.when.replace(/^.*?）\s*/, "") || "今夜")}、${esc(p.shop?.name ?? "いつもの場所")}で。`,
    lead: `${esc(p.name)} さん、おはようございます。<br>本日は「${esc(p.event.title)}」の日。お腹を空かせて、どうぞ。`,
    rows: [...decidedRows(p), { label: "アクセス", value: p.access }],
    note: p.note,
    buttons: [
      ...(p.shop?.mapUrl ? [{ label: "地図を開く", href: p.shop.mapUrl }] : []),
      { label: "会のページ", href: p.event.url, ghost: true },
    ],
    tips: ["遅れそうなときは、幹事へひとこと。", "お水もちゃんと飲みましょう。明日の自分のために。"],
    ps: "※ 二次会の場所は、たぶん誰かが急に思いつきます。",
    zh: `【中文】就是今天！${esc(p.when)}，${esc(p.shop?.name ?? "")}。空着肚子来吧。`,
    footerUrl: p.site,
  });
  const text = plain([
    `${p.name} さん、おはようございます。本日は「${p.event.title}」です。`,
    "",
    `日時: ${p.when}`,
    p.shop && `お店: ${p.shop.name}`,
    p.shop?.address && `住所: ${p.shop.address}`,
    p.access && `アクセス: ${p.access}`,
    "",
    p.shop?.mapUrl && `地図: ${p.shop.mapUrl}`,
    `会のページ: ${p.event.url}`,
  ]);
  return { subject, html, text };
}

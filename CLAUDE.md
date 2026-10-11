# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Nomikai v2 — a bilingual (Japanese / Simplified Chinese) drinking-party voting site for "バース人材". An admin creates an **event** with candidate **shops** and candidate **dates**; members pick any number of each and submit one **response**; the admin then decides one shop + date and optionally emails respondents. Next.js 15 App Router + React 19, Supabase (Postgres, Auth, Storage) via `@supabase/ssr`, Tailwind v4. UI copy is mostly Japanese.

## Commands

```sh
npm run dev          # localhost:3000
npm run typecheck    # tsc --noEmit
npm run lint         # eslint . (flat config via FlatCompat → next/core-web-vitals + next/typescript)
npm run build
```

No test suite. Env: see `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, optional `EMAIL_SERVER_*` / `EMAIL_FROM`). Without Supabase env the site renders empty with a setup notice.

To exercise `lib/shop-import.ts` outside Next: `NODE_OPTIONS="--conditions=react-server" npx tsx script.mts` (the `react-server` condition makes `server-only` importable).

## Architecture

**Database is the source of truth for permissions.** `supabase/migrations/*.sql` (apply in order) define all tables with RLS; server actions use the *user's* Supabase session, so every write is checked by RLS even if an action forgets to. The only exception is `lib/supabase/admin.ts` (service-role, server-only), used solely by `lib/notify.ts` (decision mails + morning reminder), `app/e/[slug]/attend` (HMAC-signed one-click join links, `lib/links.ts`) and `app/api/cron/day-of` (Bearer `CRON_SECRET`). Key pieces:
- `profiles` is separate from `auth.users`: `handle_new_auth_user()` trigger links a new auth user to an existing profile by email (this is how migrated legacy members are claimed) or creates one. Members may only update `display_name`/`avatar_url` (column grants); `is_admin` changes go through the `set_admin()` RPC.
- `responses` has one row per (event, profile) holding `shop_ids uuid[]` and `dates date[]`. The `validate_response` trigger rejects shops/dates not on the event and any write after close/deadline (admins bypass); it also dedupes/sorts.
- Aggregates come from the `event_results(event_id)` security-definer RPC (counts + voter names/avatars + comments), so anonymous visitors see tallies without being able to read `responses` or `profiles` directly.
- `attendees` (event, profile, going/declined, `reminded_at`) is filled when an event is decided: `notifyDecision()` adds respondents whose dates include the decided date and mails them; other respondents get an invitation with signed join/decline links. Members can also join from the event page (`setAttendance`). `event_attendees()` is the public name list.
- Events with an empty `dates` array are "free" mode: members pick any day from today to +1 year (`validate_response`, `MonthCalendar` shows this month + 2).
- `site_settings` is a single row (`id = 1`); `taglines` are the splash/hero slogans; `media` is the public Storage bucket (admin-only writes).
- Dates are `date` / `YYYY-MM-DD` strings; deadlines are `timestamptz` entered and shown in JST (`lib/format.ts`, `EventEditor` `toLocal/fromLocal`).

**Data flow.** Server Components read through `lib/data.ts` (wrapped in `react.cache`; `getViewer()` = auth user + profile). Mutations are server actions: member ones in `app/e/[slug]/actions.ts` and `app/me/actions.ts`, admin ones in `app/admin/actions.ts` (each calls `admin()` which checks `is_admin`, and returns `{ ok, data | error }`). Image uploads go straight from the browser to Storage (`components/admin/ImageInput.tsx`). `middleware.ts` only refreshes the auth cookie.

**Voting UI.** `components/VoteForm.tsx` is the single client island on the event page: shop cards + `ShopSheet` (native `<dialog>`; bottom sheet on mobile) + date tiles + note + sticky submit bar. Selections are mirrored to `localStorage` (`nomikai:draft:<eventId>`) so the login round-trip (`LoginPanel` → `/auth/callback?next=`) doesn't lose them. "Closed" is derived: `effectiveStatus()` treats `open` past its deadline as `closed`.

**Shop import.** `lib/shop-import.ts` only fetches tabelog.com / hotpepper.jp shop URLs (normalized; arbitrary hosts are rejected to avoid SSRF). Both sites embed schema.org `Restaurant` JSON-LD (name, image, address, geo, rating, ~3 reviews); the rest is scraped: info tables (`<th>`→`<td>`), Tabelog PR comment + courses + `/dtlmenu/`, HotPepper logo/catch copy + `/food/`. Selectors are brittle by nature — when imports break, re-check the class names there first. Reviews are stored as short excerpts with the source link.

**i18n.** `lib/i18n.ts` holds both dictionaries; the language is a `lang` cookie (`ja` default, `zh`) read by `lib/lang.ts` and toggled client-side by `LangToggle` + `router.refresh()`. Dictionaries contain functions, so **never pass `t` from a Server Component into a Client Component** — pass `lang` and look up `dictionaries[lang]` on the client (as `VoteForm` does). Admin UI is Japanese-only.

**Design system.** Tokens are CSS variables in `app/globals.css` (`--paper`, `--ink`, `--accent` vermilion, …) exposed to Tailwind via `@theme inline`, with a dark-mode override. Fonts: Shippori Mincho (`font-serif`, headings), Noto Sans JP (body), Cormorant Garamond (`font-display`, numerals/eyebrows — forced to lining figures). Reusable classes: `.btn .btn-primary/.btn-ghost/.btn-accent`, `.field`, `.label`, `.chip`, `.card`, `.eyebrow`. Every slogan is rendered by `components/Tagline.tsx` so copy changes never change the look; `Splash` is server-rendered and hidden pre-paint via an inline script + `html.splash-seen`.

**Mail.** `lib/email/templates.ts` builds the four HTML mails (回答受付 / 決定 / お誘い / 本日) with one inline-styled layout matching `supabase/templates/*.html`; `lib/mail.ts` sends them one by one over SMTP. The response confirmation is awaited inside `submitResponse` (not `after()`, which AWS Amplify may cut off).

**Mascot.** `public/mascot-v2.webp` / `mascot-sm-v2.webp` are generated from `public/shirt_new.png` by `scripts/mascot/cutout.py` (removes the glitch lettering) + `forks.py` (redraws the pallet-jack forks hidden under it). `Splash` (opening ride → "ドロン！"), `HeroMascot` (lands in a smoke puff; tagged `data-mascot-hero`) and `MascotDock` (root layout: flies the hero sprite into the bottom-right corner as you scroll, ninja menu on tap) use them. Bump the file name when regenerating — `next/image` caches by URL.

## Gotchas

- `app/auth/callback` handles both `?code=` (Google/PKCE) and `?token_hash=&type=email`. The Supabase email templates are customized (README step 5) to link to `{{ .RedirectTo }}&token_hash=…` so magic links work across browsers; `LoginPanel` always puts `?next=` in the redirect URL, which that `&` relies on.
- `.github/workflows/supabase-keepalive.yml` pings `site_settings` daily so the free-tier project isn't paused; it only runs from the default branch and needs `SUPABASE_URL` / `SUPABASE_ANON_KEY` repo secrets.
- `supabase/legacy-import.sql` (gitignored, contains member emails) is the generated v1 data import.

- Remote images (shop photos/logos, OAuth avatars) use plain `<img referrerPolicy="no-referrer">`, not `next/image`; `next.config.mjs` `remotePatterns` only matters for `next/image` (archive photos).
- `scripts/legacy-to-sql.mjs` converts the v1 export to SQL (deterministic `md5(...)::uuid` ids, newest duplicate legacy reservation wins). `scripts/export-legacy.mjs` needs the v1 Prisma client, so it only runs from the old `main` code.
- Files under `public/uploads/` are avatars referenced by migrated profiles; don't delete them.

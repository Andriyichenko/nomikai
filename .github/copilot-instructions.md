# Nomikai v2 — Copilot instructions

See `CLAUDE.md` for the full architecture. Key rules:

- Stack: Next.js 15 App Router, React 19, Supabase (`@supabase/ssr`), Tailwind v4. No Prisma / NextAuth anymore.
- Permissions live in Postgres RLS (`supabase/migrations/`). Server actions use the user's session, never a service-role key.
- One response per (event, member): `responses.shop_ids uuid[]` + `responses.dates date[]`; tallies come from the `event_results()` RPC.
- Admin mutations go in `app/admin/actions.ts` and return `{ ok, data | error }`; check `is_admin` via `admin()`.
- i18n dictionaries (`lib/i18n.ts`) contain functions — pass `lang` to client components, not `t`.
- Use the design tokens / classes in `app/globals.css` (`.btn`, `.field`, `.card`, `.eyebrow`, `bg-paper`, `text-ink`, `text-accent`…); slogans always render through `components/Tagline.tsx`.

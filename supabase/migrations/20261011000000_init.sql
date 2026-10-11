-- Nomikai v2 schema.
-- Model: an event (飲み会) has a set of candidate shops and candidate dates.
-- Each member submits one response per event (which shops they like + which dates they can do).
-- The admin closes the event and decides one shop + one date.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- profiles: one row per member. Linked to auth.users on first sign-in by email,
-- so members imported from the legacy system are claimed automatically.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users (id) on delete set null,
  email         text unique,
  display_name  text not null default '',
  avatar_url    text,
  is_admin      boolean not null default false,
  legacy_id     text unique,
  created_at    timestamptz not null default now()
);

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.profiles where auth_user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where auth_user_id = auth.uid()), false)
$$;

-- Create or claim a profile whenever someone signs up through Supabase Auth.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  claimed uuid;
begin
  update public.profiles
     set auth_user_id = new.id,
         avatar_url = coalesce(avatar_url, meta->>'avatar_url', meta->>'picture')
   where auth_user_id is null and lower(email) = lower(new.email)
   returning id into claimed;

  if claimed is null then
    insert into public.profiles (auth_user_id, email, display_name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(nullif(meta->>'full_name', ''), nullif(meta->>'name', ''), split_part(new.email, '@', 1)),
      coalesce(meta->>'avatar_url', meta->>'picture')
    )
    on conflict (email) do update set auth_user_id = excluded.auth_user_id;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id                 int primary key default 1 check (id = 1),
  brand              text not null default 'バース人材',
  brand_sub          text not null default '飲み会',
  notice_title       text not null default '',
  notice_body        text not null default '',
  notice_updated_at  timestamptz,
  contact_url        text not null default 'https://contact.andreyis.com',
  updated_at         timestamptz not null default now()
);
insert into public.site_settings (id) values (1);

-- Splash-screen slogans. Every active line is rendered with the same typographic style;
-- if several are active, one is picked per visit.
create table public.taglines (
  id          uuid primary key default gen_random_uuid(),
  line_ja     text not null,
  line_zh     text not null default '',
  caption_ja  text not null default '',
  caption_zh  text not null default '',
  is_active   boolean not null default true,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.shops (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  genre         text not null default '',
  summary       text not null default '',
  logo_url      text,
  cover_url     text,
  budget        text not null default '',
  address       text not null default '',
  access        text not null default '',
  hours         text not null default '',
  phone         text not null default '',
  lat           double precision,
  lng           double precision,
  rating        numeric(3, 2),
  review_count  int,
  -- [{ "author": "", "rating": 4.0, "body": "", "date": "2026-01-01" }]
  reviews       jsonb not null default '[]'::jsonb,
  -- [{ "name": "", "price": "1,280円", "note": "" }]
  menu          jsonb not null default '[]'::jsonb,
  source        text not null default 'manual' check (source in ('tabelog', 'hotpepper', 'manual', 'other')),
  source_url    text unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.events (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  description      text not null default '',
  area             text not null default '',
  start_time       text not null default '',
  budget_note      text not null default '',
  dates            date[] not null default '{}',
  deadline         timestamptz,
  status           text not null default 'open' check (status in ('draft', 'open', 'closed', 'decided')),
  decided_shop_id  uuid references public.shops (id) on delete set null,
  decided_date     date,
  legacy_id        text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.event_shops (
  event_id  uuid not null references public.events (id) on delete cascade,
  shop_id   uuid not null references public.shops (id) on delete cascade,
  position  int not null default 0,
  primary key (event_id, shop_id)
);
create index event_shops_shop_id_idx on public.event_shops (shop_id);

create table public.responses (
  event_id    uuid not null references public.events (id) on delete cascade,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  shop_ids    uuid[] not null default '{}',
  dates       date[] not null default '{}',
  comment     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (event_id, profile_id)
);
create index responses_profile_id_idx on public.responses (profile_id);

create table public.archive_entries (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  held_on     date,
  place       text not null default '',
  body        text not null default '',
  images      text[] not null default '{}',
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create index events_decided_shop_id_idx on public.events (decided_shop_id);

-- ---------------------------------------------------------------------------
-- Integrity: a response may only pick the event's own shops and dates,
-- and only while the event is open.
-- ---------------------------------------------------------------------------
create or replace function public.validate_response()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  ev public.events%rowtype;
begin
  select * into ev from public.events where id = new.event_id;
  if ev.id is null then
    raise exception 'event not found';
  end if;
  if not public.is_admin() then
    if ev.status <> 'open' or (ev.deadline is not null and ev.deadline < now()) then
      raise exception 'この会の受付は終了しました' using errcode = 'P0001';
    end if;
  end if;
  if exists (
    select 1 from unnest(new.shop_ids) s
    where s not in (select shop_id from public.event_shops where event_id = new.event_id)
  ) then
    raise exception 'invalid shop' using errcode = 'P0001';
  end if;
  if not (new.dates <@ ev.dates) then
    raise exception 'invalid date' using errcode = 'P0001';
  end if;
  new.shop_ids := array(select distinct unnest(new.shop_ids));
  new.dates := array(select distinct d from unnest(new.dates) d order by d);
  new.comment := left(coalesce(new.comment, ''), 500);
  new.updated_at := now();
  return new;
end $$;

create trigger responses_validate
  before insert or update on public.responses
  for each row execute function public.validate_response();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger shops_touch before update on public.shops for each row execute function public.touch_updated_at();
create trigger events_touch before update on public.events for each row execute function public.touch_updated_at();
create trigger site_settings_touch before update on public.site_settings for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Aggregated results (who voted for what) — readable by anyone for public events.
-- ---------------------------------------------------------------------------
create or replace function public.event_results(p_event uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with ev as (
    select * from public.events where id = p_event and (status <> 'draft' or public.is_admin())
  ),
  r as (
    select r.*, p.display_name, p.avatar_url
    from public.responses r
    join public.profiles p on p.id = r.profile_id
    where r.event_id in (select id from ev)
  )
  select case when not exists (select 1 from ev) then null else jsonb_build_object(
    'respondents', (select count(*) from r),
    'shops', coalesce((
      select jsonb_agg(jsonb_build_object('shop_id', s, 'count', cnt, 'voters', voters) order by cnt desc)
      from (
        select s, count(*) cnt,
               jsonb_agg(jsonb_build_object('name', display_name, 'avatar', avatar_url) order by display_name) voters
        from r, unnest(r.shop_ids) s group by s
      ) x), '[]'::jsonb),
    'dates', coalesce((
      select jsonb_agg(jsonb_build_object('date', d, 'count', cnt, 'voters', voters) order by d)
      from (
        select d, count(*) cnt,
               jsonb_agg(jsonb_build_object('name', display_name, 'avatar', avatar_url) order by display_name) voters
        from r, unnest(r.dates) d group by d
      ) y), '[]'::jsonb),
    'people', coalesce((
      select jsonb_agg(jsonb_build_object('name', display_name, 'avatar', avatar_url, 'comment', comment,
                                          'shops', shop_ids, 'dates', dates) order by updated_at desc)
      from r), '[]'::jsonb)
  ) end
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.site_settings   enable row level security;
alter table public.taglines        enable row level security;
alter table public.shops           enable row level security;
alter table public.events          enable row level security;
alter table public.event_shops     enable row level security;
alter table public.responses       enable row level security;
alter table public.archive_entries enable row level security;

-- profiles: you see yourself; admins see everyone. Members can only rename themselves.
create policy "profiles: self or admin read" on public.profiles for select
  using (auth_user_id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: self update" on public.profiles for update
  using (auth_user_id = (select auth.uid())) with check (auth_user_id = (select auth.uid()));
create policy "profiles: admin all" on public.profiles for all
  using ((select public.is_admin())) with check ((select public.is_admin()));
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- public content
create policy "site_settings: read" on public.site_settings for select using (true);
create policy "site_settings: admin write" on public.site_settings for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "taglines: read" on public.taglines for select using (true);
create policy "taglines: admin write" on public.taglines for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "shops: read" on public.shops for select using (true);
create policy "shops: admin write" on public.shops for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "events: read published" on public.events for select
  using (status <> 'draft' or (select public.is_admin()));
create policy "events: admin write" on public.events for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "event_shops: read" on public.event_shops for select using (true);
create policy "event_shops: admin write" on public.event_shops for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "archive: read" on public.archive_entries for select using (true);
create policy "archive: admin write" on public.archive_entries for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- responses: members manage their own row; everyone sees aggregates via event_results().
create policy "responses: own read" on public.responses for select
  using (profile_id = (select public.current_profile_id()) or (select public.is_admin()));
create policy "responses: own insert" on public.responses for insert
  with check (profile_id = (select public.current_profile_id()));
create policy "responses: own update" on public.responses for update
  using (profile_id = (select public.current_profile_id()))
  with check (profile_id = (select public.current_profile_id()));
create policy "responses: own delete while open" on public.responses for delete
  using (
    profile_id = (select public.current_profile_id())
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'open' and (e.deadline is null or e.deadline > now())
    )
  );
create policy "responses: admin all" on public.responses for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- is_admin is not column-granted above, so promotion goes through this checked RPC.
create or replace function public.set_admin(p_profile uuid, p_value boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_profile = public.current_profile_id() and not p_value then
    raise exception '自分の管理者権限は外せません' using errcode = 'P0001';
  end if;
  update public.profiles set is_admin = p_value where id = p_profile;
end $$;

revoke execute on function public.set_admin(uuid, boolean) from public, anon;
grant execute on function public.set_admin(uuid, boolean) to authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.validate_response() from public, anon, authenticated;
grant execute on function public.event_results(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: one public bucket for logos, covers and archive photos. Admin-only writes.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do nothing;

create policy "media: admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy "media: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
create policy "media: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

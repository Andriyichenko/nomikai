-- Who is actually going to a decided event.
-- * respondents whose dates include the decided date are added as 'going' (source 'vote')
-- * other respondents are invited by mail and can join/decline (source 'invite')
-- * members can also join from the event page
-- reminded_at records the morning-of reminder so it is sent only once.
create table public.attendees (
  event_id     uuid not null references public.events (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  status       text not null check (status in ('going', 'declined')),
  source       text not null default 'vote' check (source in ('vote', 'invite', 'page', 'admin')),
  reminded_at  timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (event_id, profile_id)
);
create index attendees_profile_id_idx on public.attendees (profile_id);

alter table public.attendees enable row level security;

create policy "attendees: own or admin read" on public.attendees for select
  using (profile_id = (select public.current_profile_id()) or (select public.is_admin()));

-- members may join/decline themselves, only for a decided event that has not happened yet
create policy "attendees: self join" on public.attendees for insert
  with check (
    profile_id = (select public.current_profile_id())
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'decided'
        and e.decided_date >= (now() at time zone 'Asia/Tokyo')::date
    )
  );
create policy "attendees: self update" on public.attendees for update
  using (profile_id = (select public.current_profile_id()))
  with check (
    profile_id = (select public.current_profile_id())
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'decided'
        and e.decided_date >= (now() at time zone 'Asia/Tokyo')::date
    )
  );
create policy "attendees: admin all" on public.attendees for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- members cannot backdate the reminder flag
revoke update on public.attendees from authenticated;
grant update (status, source, updated_at) on public.attendees to authenticated;

-- Public list of who is going (names/avatars only), like event_results().
create or replace function public.event_attendees(p_event uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', p.display_name, 'avatar', p.avatar_url) order by a.updated_at), '[]'::jsonb)
  from public.attendees a
  join public.profiles p on p.id = a.profile_id
  join public.events e on e.id = a.event_id
  where a.event_id = p_event and a.status = 'going' and (e.status <> 'draft' or public.is_admin())
$$;
grant execute on function public.event_attendees(uuid) to anon, authenticated;

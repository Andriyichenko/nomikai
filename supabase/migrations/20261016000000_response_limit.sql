-- Submitting / updating / withdrawing an answer sends a mail, so cap it like attendance
-- (20261015000000_attendance_limit.sql): at most 10 changes per member per event per day (JST).
-- The counter lives in its own table so it survives the response row being deleted.
-- Admins are not counted.
create table public.response_quota (
  event_id   uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day        date not null,
  count      integer not null default 0,
  primary key (event_id, profile_id)
);
-- written only by the trigger below (security definer); no API access
alter table public.response_quota enable row level security;

create or replace function public.responses_limit_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
  eid uuid;
  pid uuid;
  n integer;
begin
  if public.is_admin() then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    eid := old.event_id; pid := old.profile_id;
  else
    eid := new.event_id; pid := new.profile_id;
  end if;
  -- an upsert on an existing row fires BEFORE INSERT and then BEFORE UPDATE: count it once
  if tg_op = 'INSERT' and exists (select 1 from public.responses where event_id = eid and profile_id = pid) then
    return new;
  end if;

  insert into public.response_quota as q (event_id, profile_id, day, count)
  values (eid, pid, today, 1)
  on conflict (event_id, profile_id) do update
    set count = case when q.day = today then q.count + 1 else 1 end, day = today
  returning q.count into n;

  if n > 10 then
    raise exception 'response change limit reached' using errcode = 'P0001', hint = 'response_limit';
  end if;
  return coalesce(new, old);
end
$$;
revoke execute on function public.responses_limit_changes() from public, anon, authenticated;

create trigger responses_limit_changes
  before insert or update or delete on public.responses
  for each row execute function public.responses_limit_changes();

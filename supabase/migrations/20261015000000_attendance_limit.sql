-- Join / decline from the event page or the invitation mail now sends a mail, so cap how often
-- a member can flip their attendance: at most 10 status changes per event per day (JST).
-- Only member-driven changes count (source 'page' / 'invite'); the decision itself ('vote')
-- and admin edits ('admin') do not.
alter table public.attendees
  add column change_day   date,
  add column change_count integer not null default 0;

create or replace function public.attendees_limit_changes()
returns trigger language plpgsql set search_path = '' as $$
declare
  today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  if new.source not in ('page', 'invite') then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      -- no real change: keep the counter as it was
      new.change_day := old.change_day;
      new.change_count := old.change_count;
      return new;
    end if;
    new.change_count := case when old.change_day = today then old.change_count + 1 else 1 end;
  else
    new.change_count := 1;
  end if;
  new.change_day := today;
  if new.change_count > 10 then
    raise exception 'attendance change limit reached' using errcode = 'P0001', hint = 'attend_limit';
  end if;
  return new;
end
$$;

create trigger attendees_limit_changes
  before insert or update on public.attendees
  for each row execute function public.attendees_limit_changes();

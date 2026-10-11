-- Events without candidate dates let members pick any day (from today up to one year ahead).
-- Events that do list candidate dates still restrict answers to those dates.
create or replace function public.validate_response()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  ev public.events%rowtype;
  today date := (now() at time zone 'Asia/Tokyo')::date;
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
  if coalesce(array_length(ev.dates, 1), 0) > 0 then
    if not (new.dates <@ ev.dates) then
      raise exception 'invalid date' using errcode = 'P0001';
    end if;
  elsif tg_op = 'INSERT' or new.dates is distinct from old.dates then
    if exists (select 1 from unnest(new.dates) d where d < today or d > today + 365) then
      raise exception '選べるのは今日から1年以内の日付です' using errcode = 'P0001';
    end if;
  end if;
  new.shop_ids := array(select distinct unnest(new.shop_ids));
  new.dates := array(select distinct d from unnest(new.dates) d order by d);
  new.comment := left(coalesce(new.comment, ''), 500);
  new.updated_at := now();
  return new;
end $$;

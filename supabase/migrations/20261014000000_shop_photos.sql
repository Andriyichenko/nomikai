-- Photo gallery for shops (imported from 食べログ / ホットペッパー, or added by hand).
alter table public.shops add column if not exists photos text[] not null default '{}';

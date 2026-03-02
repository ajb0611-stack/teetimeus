create extension if not exists pg_trgm;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  city text,
  state text not null default 'FL',
  zip text,
  image_url text,
  tee_time_url text not null,
  website_url text,
  phone text,
  is_public boolean not null default true,
  clicks bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_name_trgm_idx on public.courses using gin (name gin_trgm_ops);
create index if not exists courses_city_idx on public.courses(city);
create index if not exists courses_zip_idx on public.courses(zip);
create index if not exists courses_state_idx on public.courses(state);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

alter table public.courses enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

create policy "courses_select_public"
on public.courses for select
using (is_public = true);

create policy "courses_select_admin"
on public.courses for select
using (public.is_admin());

create policy "courses_write_admin"
on public.courses for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins_select_admin"
on public.admins for select
using (public.is_admin());

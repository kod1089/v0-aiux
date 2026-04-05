-- 001_create_profiles.sql
-- User profiles table linked to auth.users

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "profiles_select_own" on public.profiles 
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles 
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles 
  for update using (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles 
  for delete using (auth.uid() = id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

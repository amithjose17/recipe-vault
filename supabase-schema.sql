-- ============================================================
-- Recipe Vault – Supabase Schema
-- Run this in your Supabase project → SQL Editor → New Query
-- ============================================================

create table if not exists recipes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  title text not null,
  description text,
  source_url text,
  image_url text,
  base_servings integer not null default 4,
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  tags text[] default '{}',
  tips text[] default '{}',
  cuisine text,
  cook_time_mins integer,
  prep_time_mins integer,
  is_public boolean default false,
  share_slug text unique
);

-- Enable Row Level Security
alter table recipes enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public recipes viewable" on recipes;
drop policy if exists "All select with anon" on recipes;
drop policy if exists "Anon insert" on recipes;
drop policy if exists "Anon update" on recipes;
drop policy if exists "Anon delete" on recipes;

-- Public recipes readable by everyone
create policy "Public recipes viewable"
  on recipes for select
  using (is_public = true);

-- All recipes readable (auth handled in app)
create policy "All select with anon"
  on recipes for select
  using (true);

create policy "Anon insert"
  on recipes for insert
  with check (true);

create policy "Anon update"
  on recipes for update
  using (true);

create policy "Anon delete"
  on recipes for delete
  using (true);

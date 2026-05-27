import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Database Schema (run this in Supabase SQL editor) ───────────────────────
//
// create table recipes (
//   id uuid default gen_random_uuid() primary key,
//   created_at timestamptz default now(),
//   title text not null,
//   description text,
//   source_url text,
//   image_url text,
//   base_servings integer not null default 4,
//   ingredients jsonb not null default '[]',
//   steps jsonb not null default '[]',
//   tags text[] default '{}',
//   cuisine text,
//   cook_time_mins integer,
//   prep_time_mins integer,
//   is_public boolean default false,
//   share_slug text unique
// );
//
// -- Enable Row Level Security
// alter table recipes enable row level security;
//
// -- Public can read public recipes
// create policy "Public recipes are viewable by everyone"
//   on recipes for select
//   using (is_public = true);
//
// -- All recipes readable via anon key (we handle auth in the app)
// create policy "All recipes readable with anon key"
//   on recipes for select
//   using (true);
//
// create policy "Anon can insert recipes"
//   on recipes for insert
//   with check (true);
//
// create policy "Anon can update recipes"
//   on recipes for update
//   using (true);
//
// create policy "Anon can delete recipes"
//   on recipes for delete
//   using (true);

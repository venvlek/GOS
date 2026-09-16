-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- It creates the single table this app uses for everything: classes, teachers,
-- students, attendance, lesson notes, diary, holidays, terms.

create table if not exists store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Row Level Security is on by default for new projects. These policies let
-- the app's anon key read and write every row. See the README's "Security
-- note" — there is no per-user auth here, only the app's own PIN screens,
-- so anyone with your project URL + anon key could read/write this table
-- directly (bypassing the app). Acceptable for a small internal school
-- tool; not a substitute for real auth if that ever matters more.
alter table store enable row level security;

create policy "anon can read" on store
  for select using (true);

create policy "anon can insert" on store
  for insert with check (true);

create policy "anon can update" on store
  for update using (true);

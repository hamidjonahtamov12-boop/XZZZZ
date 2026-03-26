create extension if not exists "pgcrypto";

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  note text,
  category text,
  color text not null default '#D9844D',
  reminder_time time,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.habits
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.habits
  add column if not exists note text;

alter table public.habits
  add column if not exists category text;

alter table public.habits
  add column if not exists color text not null default '#D9844D';

alter table public.habits
  add column if not exists reminder_time time;

alter table public.habits
  add column if not exists is_archived boolean not null default false;

alter table public.habits
  add column if not exists created_at timestamptz not null default now();

alter table public.habits
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  content text,
  mood text not null default 'calm',
  entry_date date not null default current_date,
  day_score smallint,
  energy_level smallint,
  stress_level smallint,
  focus_level smallint,
  tags text[] not null default '{}',
  photo_url text,
  place_label text,
  latitude double precision,
  longitude double precision,
  location_accuracy_meters double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.journal_entries
  add column if not exists body text;

alter table public.journal_entries
  add column if not exists content text;

alter table public.journal_entries
  add column if not exists mood text not null default 'calm';

alter table public.journal_entries
  add column if not exists entry_date date not null default current_date;

alter table public.journal_entries
  add column if not exists day_score smallint;

alter table public.journal_entries
  add column if not exists energy_level smallint;

alter table public.journal_entries
  add column if not exists stress_level smallint;

alter table public.journal_entries
  add column if not exists focus_level smallint;

alter table public.journal_entries
  add column if not exists tags text[] not null default '{}';

alter table public.journal_entries
  add column if not exists photo_url text;

alter table public.journal_entries
  add column if not exists place_label text;

alter table public.journal_entries
  add column if not exists latitude double precision;

alter table public.journal_entries
  add column if not exists longitude double precision;

alter table public.journal_entries
  add column if not exists location_accuracy_meters double precision;

alter table public.journal_entries
  add column if not exists created_at timestamptz not null default now();

alter table public.journal_entries
  add column if not exists updated_at timestamptz not null default now();

update public.journal_entries
set body = coalesce(body, content)
where body is null and content is not null;

update public.journal_entries
set content = coalesce(content, body)
where content is null and body is not null;

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

alter table public.habit_logs
  add column if not exists completed_on date not null default current_date;

alter table public.habit_logs
  add column if not exists created_at timestamptz not null default now();

create index if not exists habits_user_id_idx
  on public.habits (user_id, created_at desc);

create index if not exists journal_entries_user_id_idx
  on public.journal_entries (user_id, entry_date desc);

create index if not exists habit_logs_completed_on_idx
  on public.habit_logs (completed_on desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.habits to anon, authenticated;
grant select, insert, update, delete on public.journal_entries to anon, authenticated;
grant select, insert, delete on public.habit_logs to anon, authenticated;

alter table public.habits enable row level security;
alter table public.journal_entries enable row level security;
alter table public.habit_logs enable row level security;

drop policy if exists "Habits select own" on public.habits;
drop policy if exists "Habits insert own" on public.habits;
drop policy if exists "Habits update own" on public.habits;
drop policy if exists "Habits delete own" on public.habits;
drop policy if exists "Public habits read" on public.habits;
drop policy if exists "Public habits insert" on public.habits;
drop policy if exists "Public habits update" on public.habits;
drop policy if exists "Public habits delete" on public.habits;

create policy "Public habits read"
on public.habits
for select
to public
using (true);

create policy "Public habits insert"
on public.habits
for insert
to public
with check (true);

create policy "Public habits update"
on public.habits
for update
to public
using (true)
with check (true);

create policy "Public habits delete"
on public.habits
for delete
to public
using (true);

drop policy if exists "Entries select own" on public.journal_entries;
drop policy if exists "Entries insert own" on public.journal_entries;
drop policy if exists "Entries update own" on public.journal_entries;
drop policy if exists "Entries delete own" on public.journal_entries;
drop policy if exists "Public journal read" on public.journal_entries;
drop policy if exists "Public journal insert" on public.journal_entries;
drop policy if exists "Public journal update" on public.journal_entries;
drop policy if exists "Public journal delete" on public.journal_entries;

create policy "Public journal read"
on public.journal_entries
for select
to public
using (true);

create policy "Public journal insert"
on public.journal_entries
for insert
to public
with check (true);

create policy "Public journal update"
on public.journal_entries
for update
to public
using (true)
with check (true);

create policy "Public journal delete"
on public.journal_entries
for delete
to public
using (true);

drop policy if exists "Habit logs select own" on public.habit_logs;
drop policy if exists "Habit logs insert own" on public.habit_logs;
drop policy if exists "Habit logs delete own" on public.habit_logs;
drop policy if exists "Public habit logs read" on public.habit_logs;
drop policy if exists "Public habit logs insert" on public.habit_logs;
drop policy if exists "Public habit logs delete" on public.habit_logs;

create policy "Public habit logs read"
on public.habit_logs
for select
to public
using (true);

create policy "Public habit logs insert"
on public.habit_logs
for insert
to public
with check (true);

create policy "Public habit logs delete"
on public.habit_logs
for delete
to public
using (true);

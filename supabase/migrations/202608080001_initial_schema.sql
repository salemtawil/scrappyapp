create extension if not exists pgcrypto;
create extension if not exists citext;

create type club_role as enum ('owner', 'admin', 'organizer', 'scorer', 'member');
create type competition_category as enum ('SOCIAL', 'TOURNAMENT', 'LEAGUE');
create type competition_format as enum (
  'AMERICANO',
  'MEXICANO',
  'ROUND_ROBIN',
  'SINGLE_ELIMINATION',
  'DOUBLE_ELIMINATION',
  'GROUPS_PLAYOFF',
  'SINGLE_ROUND_ROBIN',
  'DOUBLE_ROUND_ROBIN'
);
create type competition_status as enum ('draft', 'registration', 'ready', 'live', 'finished', 'cancelled');
create type competition_visibility as enum ('public', 'private');
create type engine_provider as enum ('custom', 'courthive');
create type entry_status as enum ('active', 'withdrawn', 'removed');
create type match_status as enum ('pending', 'completed', 'void');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  avatar_url text,
  locale text not null default 'es',
  timezone text not null default 'Europe/Madrid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table clubs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  slug citext not null unique,
  logo_url text,
  timezone text not null default 'Europe/Madrid',
  city text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table club_members (
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role club_role not null,
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create table players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  linked_user_id uuid references profiles(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  email citext,
  phone text,
  rating numeric(5,2),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index players_club_name_idx on players (club_id, lower(display_name));

create table courts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  unique (club_id, name)
);

create table competitions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references profiles(id) on delete cascade,
  club_id uuid references clubs(id) on delete set null,
  name text not null check (char_length(name) between 1 and 100),
  description text,
  category competition_category not null,
  format competition_format not null,
  status competition_status not null default 'draft',
  visibility competition_visibility not null default 'public',
  public_room_code citext not null unique,
  timezone text not null default 'Europe/Madrid',
  starts_at timestamptz,
  ends_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  engine_provider engine_provider not null default 'custom',
  engine_record jsonb,
  engine_version text,
  state_version integer not null default 0,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index competitions_owner_idx on competitions (owner_user_id, starts_at desc);
create index competitions_club_idx on competitions (club_id, starts_at desc);
create index competitions_room_idx on competitions (public_room_code);

create table competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  player_id uuid references players(id) on delete set null,
  display_name_snapshot text not null,
  seed integer not null,
  initial_rating numeric(5,2),
  status entry_status not null default 'active',
  joined_at timestamptz not null default now(),
  sort_order integer not null default 0,
  unique (competition_id, seed)
);

create table competition_pairs (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  name text,
  seed integer not null,
  initial_rating numeric(5,2),
  status entry_status not null default 'active',
  unique (competition_id, seed)
);

create table pair_members (
  pair_id uuid not null references competition_pairs(id) on delete cascade,
  entry_id uuid not null references competition_entries(id) on delete cascade,
  position integer not null check (position in (1, 2)),
  primary key (pair_id, entry_id),
  unique (pair_id, position)
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  round_number integer not null,
  name text,
  engine_structure_id text,
  status match_status not null default 'pending',
  generated_from_state_version integer not null default 0,
  created_at timestamptz not null default now(),
  unique (competition_id, round_number)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  round_id uuid not null references rounds(id) on delete cascade,
  round_number integer not null,
  court_label text,
  engine_matchup_id text,
  side_a_entry_ids uuid[],
  side_b_entry_ids uuid[],
  side_a_pair_id uuid references competition_pairs(id) on delete set null,
  side_b_pair_id uuid references competition_pairs(id) on delete set null,
  score jsonb,
  winner_side text check (winner_side in ('A', 'B') or winner_side is null),
  status match_status not null default 'pending',
  state_version integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create index matches_competition_round_idx on matches (competition_id, round_number);
create index matches_engine_idx on matches (competition_id, engine_matchup_id);

create table standings (
  competition_id uuid not null references competitions(id) on delete cascade,
  subject_type text not null check (subject_type in ('entry', 'pair')),
  subject_id uuid not null,
  position integer not null,
  stats jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (competition_id, subject_type, subject_id)
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  actor_user_id uuid references profiles(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_logs_competition_idx on activity_logs (competition_id, created_at desc);

alter table profiles enable row level security;
alter table clubs enable row level security;
alter table club_members enable row level security;
alter table players enable row level security;
alter table courts enable row level security;
alter table competitions enable row level security;
alter table competition_entries enable row level security;
alter table competition_pairs enable row level security;
alter table pair_members enable row level security;
alter table rounds enable row level security;
alter table matches enable row level security;
alter table standings enable row level security;
alter table activity_logs enable row level security;

create policy "profiles_self" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "public_competitions_read" on competitions for select using (visibility = 'public');
create policy "owner_competitions_all" on competitions for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
create policy "public_rounds_read" on rounds for select using (
  exists (select 1 from competitions c where c.id = competition_id and c.visibility = 'public')
);
create policy "public_matches_read" on matches for select using (
  exists (select 1 from competitions c where c.id = competition_id and c.visibility = 'public')
);
create policy "public_standings_read" on standings for select using (
  exists (select 1 from competitions c where c.id = competition_id and c.visibility = 'public')
);

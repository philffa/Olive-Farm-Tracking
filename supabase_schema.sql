-- ============================================================
-- OLIVE FARM TRACKING — Supabase Schema
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- FARMS
-- ============================================================
create table farms (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Olive Farm',
  lat numeric default -27.770830,
  lng numeric default 152.253333,
  created_at timestamptz default now()
);

-- ============================================================
-- PROFILES (linked to Supabase auth users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  farm_id uuid references farms(id),
  full_name text,
  role text default 'owner', -- owner | manager | worker | viewer
  created_at timestamptz default now()
);

-- ============================================================
-- ASSETS (animals, paddocks, hives, equipment, plants)
-- ============================================================
create table assets (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references farms(id) on delete cascade,
  name text not null,
  type text not null, -- animal | paddock | hive | equipment | plant | other
  species text,       -- e.g. "Goat", "European bee", "Finger lime"
  identifier text,    -- tag number, hive number, plot name etc
  notes text,
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table categories (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references farms(id) on delete cascade,
  name text not null,
  color text default '#7a9e7e',
  icon text default '📋',
  weather_sensitive boolean default false -- tasks in this category get weather flagged
);

-- Insert default categories
insert into categories (id, farm_id, name, color, icon, weather_sensitive) values
  (uuid_generate_v4(), null, 'Livestock & Animals', '#6b4c35', '🐐', false),
  (uuid_generate_v4(), null, 'Bees', '#c8a96e', '🐝', true),
  (uuid_generate_v4(), null, 'Crops & Garden', '#7a9e7e', '🌱', true),
  (uuid_generate_v4(), null, 'Infrastructure', '#9a7d6a', '🔧', false),
  (uuid_generate_v4(), null, 'Admin & Legal', '#b85c38', '📋', false),
  (uuid_generate_v4(), null, 'Financial', '#3d2b1f', '💰', false),
  (uuid_generate_v4(), null, 'Pasture', '#4e7453', '🌿', true),
  (uuid_generate_v4(), null, 'Water', '#2a6980', '💧', false),
  (uuid_generate_v4(), null, 'General', '#5c4535', '📌', false);

-- ============================================================
-- TASKS (the calendar layer)
-- ============================================================
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references farms(id) on delete cascade,
  title text not null,
  description text,
  category_id uuid references categories(id),
  asset_id uuid references assets(id),   -- optional link to specific animal/paddock/hive
  
  -- Scheduling
  due_date date not null,
  due_time time,
  
  -- Recurrence
  recurrence text default 'none', -- none | daily | weekly | fortnightly | monthly | custom
  recurrence_interval integer default 1,
  recurrence_day_of_week integer,  -- 0=Sun, 1=Mon ... 6=Sat
  recurrence_end_date date,
  recurrence_parent_id uuid references tasks(id), -- links generated instances to their series
  
  -- Status
  status text default 'pending', -- pending | done | snoozed | skipped
  completed_at timestamptz,
  completed_by uuid references profiles(id),
  
  -- Priority / compliance
  priority text default 'normal', -- normal | high | legal
  legal_reminder_sent boolean default false,
  
  -- Weather
  weather_sensitive boolean default false,
  weather_condition text, -- dry | no_frost | no_extreme_heat | any
  
  -- Finance
  estimated_cost numeric,
  actual_cost numeric,
  
  -- Google Calendar
  gcal_event_id text,
  
  -- Assignment (for future team use)
  assigned_to uuid references profiles(id),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SNOOZE LOG (every time a task is deferred)
-- ============================================================
create table task_snooze_log (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete cascade,
  original_date date,
  new_date date,
  reason text,
  snoozed_by uuid references profiles(id),
  snoozed_at timestamptz default now()
);

-- ============================================================
-- RECORDS (the logbook layer — from existing farm records app)
-- ============================================================
create table records (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references farms(id) on delete cascade,
  section text not null,     -- geese | goats | eggs | health | finance | custom_xxx etc
  data jsonb not null,       -- all field values stored as JSON
  task_id uuid references tasks(id), -- optional: which task completion triggered this
  asset_id uuid references assets(id),
  photos jsonb,              -- [{id, thumb, cloudUrl, status}]
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- FINANCE / INVOICES
-- ============================================================
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references farms(id) on delete cascade,
  record_id uuid references records(id),
  -- Raw OCR data
  raw_text text,
  image_url text,
  -- Extracted fields
  supplier_name text,
  supplier_abn text,
  invoice_number text,
  invoice_date date,
  total_amount numeric,
  gst_amount numeric,
  ex_gst_amount numeric,
  gst_status text,
  -- Classification
  ato_category text,
  enterprise text,
  bas_quarter text,
  -- Status
  status text default 'draft', -- draft | confirmed | exported
  created_at timestamptz default now()
);

-- ============================================================
-- GOOGLE CALENDAR SYNC
-- ============================================================
create table gcal_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  calendar_id text default 'primary',
  sync_enabled boolean default false,
  updated_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table farms enable row level security;
alter table profiles enable row level security;
alter table assets enable row level security;
alter table categories enable row level security;
alter table tasks enable row level security;
alter table task_snooze_log enable row level security;
alter table records enable row level security;
alter table invoices enable row level security;
alter table gcal_tokens enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- Everything else: scoped to farm membership
create policy "farm_member_farms" on farms for all
  using (id in (select farm_id from profiles where id = auth.uid()));

create policy "farm_member_assets" on assets for all
  using (farm_id in (select farm_id from profiles where id = auth.uid()));

create policy "farm_member_categories" on categories for all
  using (farm_id in (select farm_id from profiles where id = auth.uid()) or farm_id is null);

create policy "farm_member_tasks" on tasks for all
  using (farm_id in (select farm_id from profiles where id = auth.uid()));

create policy "farm_member_snooze" on task_snooze_log for all
  using (task_id in (select id from tasks where farm_id in (select farm_id from profiles where id = auth.uid())));

create policy "farm_member_records" on records for all
  using (farm_id in (select farm_id from profiles where id = auth.uid()));

create policy "farm_member_invoices" on invoices for all
  using (farm_id in (select farm_id from profiles where id = auth.uid()));

create policy "gcal_own" on gcal_tokens for all using (user_id = auth.uid());

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile + farm on first sign-in
create or replace function handle_new_user()
returns trigger as $$
declare
  new_farm_id uuid;
begin
  insert into farms (name) values ('Olive Farm') returning id into new_farm_id;
  insert into profiles (id, farm_id, full_name, role)
    values (new.id, new_farm_id, new.raw_user_meta_data->>'full_name', 'owner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger tasks_updated_at before update on tasks
  for each row execute procedure update_updated_at();
create trigger records_updated_at before update on records
  for each row execute procedure update_updated_at();

-- ============================================================
-- CROP PLAN STATUS (tracks per-farm override of crop statuses)
-- The crop catalogue is built into the app code.
-- This table lets you override status, add notes, track planting dates.
-- ============================================================
create table crop_plan_status (
  id uuid primary key default uuid_generate_v4(),
  farm_id uuid references farms(id) on delete cascade,
  crop_id integer not null,          -- matches id in cropPlan.js
  crop_name text not null,
  status_override text,              -- if set, overrides the built-in status
  planted_date date,
  quantity_planted numeric,
  quantity_unit text,
  location_notes text,               -- where on property it was planted
  first_harvest_date date,
  farm_notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table crop_plan_status enable row level security;
create policy "farm_member_cropplan" on crop_plan_status for all
  using (farm_id in (select farm_id from profiles where id = auth.uid()));

create trigger cropplan_updated_at before update on crop_plan_status
  for each row execute procedure update_updated_at();

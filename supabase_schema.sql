-- ============================================
-- AI Evidence Synthesis - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- Projects table
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  pico_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Screening results (combined Level 1 and Level 2)
create table screening_results (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  level integer not null check (level in (1, 2)),
  title text not null,
  abstract text default '',
  -- Current decision (may differ from AI if overridden)
  decision text default 'UNCLEAR' check (decision in ('INCLUDE', 'EXCLUDE', 'UNCLEAR')),
  -- Original AI decision (NEVER changes — the permanent audit record)
  ai_decision text default 'UNCLEAR' check (ai_decision in ('INCLUDE', 'EXCLUDE', 'UNCLEAR')),
  reason text default '',
  confidence integer default 0,
  p_check boolean default false,
  i_check boolean default false,
  c_check boolean default false,
  o_check boolean default false,
  s_check boolean default false,
  e_check boolean default false,
  p_reas text default '',
  i_reas text default '',
  c_reas text default '',
  o_reas text default '',
  s_reas text default '',
  e_reas text default '',
  source text default '',
  -- Full override audit trail: JSON array of {from, to, by, at, note}
  override_history jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index idx_projects_user on projects(user_id);
create index idx_results_project on screening_results(project_id);
create index idx_results_level on screening_results(project_id, level);
create index idx_results_overridden on screening_results(project_id) where override_history != '[]'::jsonb;

-- ============================================
-- Row Level Security (RLS)
-- Users can only access their own data
-- ============================================

alter table projects enable row level security;
alter table screening_results enable row level security;

-- Projects: users can only see/modify their own
create policy "Users can view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Screening results: users can access results for their own projects
create policy "Users can view own results"
  on screening_results for select
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can create results for own projects"
  on screening_results for insert
  with check (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can update own results"
  on screening_results for update
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can delete own results"
  on screening_results for delete
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

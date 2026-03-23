-- ============================================
-- Usage Tracking & Limits
-- Run this AFTER the main schema
-- ============================================

-- Per-user monthly usage counter
create table usage_counters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  month text not null, -- format: '2026-03'
  screening_count integer default 0,
  created_at timestamptz default now(),
  unique(user_id, month)
);

-- Global free tier counter (one row per month)
create table global_limits (
  id uuid default uuid_generate_v4() primary key,
  month text not null unique, -- format: '2026-03'
  total_screenings integer default 0,
  max_screenings integer default 500,
  registrations integer default 0,
  max_registrations integer default 100
);

-- Indexes
create index idx_usage_user_month on usage_counters(user_id, month);
create index idx_global_month on global_limits(month);

-- RLS: users can only see their own usage
alter table usage_counters enable row level security;
alter table global_limits enable row level security;

create policy "Users can view own usage"
  on usage_counters for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on usage_counters for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on usage_counters for update
  using (auth.uid() = user_id);

-- Global limits: anyone authenticated can read (to check if free tier is full)
create policy "Authenticated users can view global limits"
  on global_limits for select
  using (auth.role() = 'authenticated');

-- Only service role can modify global limits (via backend or triggers)
-- For now, we increment via the frontend with a simple upsert

-- Function to increment user screening count and global count atomically
create or replace function increment_screening_count(p_user_id uuid)
returns json as $$
declare
  current_month text := to_char(now(), 'YYYY-MM');
  user_count integer;
  global_count integer;
  user_limit integer := 20;
  global_limit integer := 500;
begin
  -- Upsert user counter
  insert into usage_counters (user_id, month, screening_count)
  values (p_user_id, current_month, 1)
  on conflict (user_id, month)
  do update set screening_count = usage_counters.screening_count + 1
  returning screening_count into user_count;

  -- Upsert global counter
  insert into global_limits (month, total_screenings, max_screenings)
  values (current_month, 1, global_limit)
  on conflict (month)
  do update set total_screenings = global_limits.total_screenings + 1
  returning total_screenings into global_count;

  return json_build_object(
    'user_count', user_count,
    'user_limit', user_limit,
    'global_count', global_count,
    'global_limit', global_limit,
    'allowed', user_count <= user_limit and global_count <= global_limit
  );
end;
$$ language plpgsql security definer;

-- Function to check limits without incrementing
create or replace function check_screening_limits(p_user_id uuid)
returns json as $$
declare
  current_month text := to_char(now(), 'YYYY-MM');
  user_count integer;
  global_count integer;
  user_limit integer := 20;
  global_limit integer := 500;
begin
  select coalesce(screening_count, 0) into user_count
  from usage_counters
  where user_id = p_user_id and month = current_month;

  if user_count is null then user_count := 0; end if;

  select coalesce(total_screenings, 0) into global_count
  from global_limits
  where month = current_month;

  if global_count is null then global_count := 0; end if;

  return json_build_object(
    'user_count', user_count,
    'user_limit', user_limit,
    'user_remaining', greatest(user_limit - user_count, 0),
    'global_count', global_count,
    'global_limit', global_limit,
    'global_remaining', greatest(global_limit - global_count, 0),
    'allowed', user_count < user_limit and global_count < global_limit,
    'reason', case
      when user_count >= user_limit then 'user_limit'
      when global_count >= global_limit then 'global_limit'
      else 'ok'
    end
  );
end;
$$ language plpgsql security definer;

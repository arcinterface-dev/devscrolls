-- ==============================================================================
-- DevScrolls: Supabase Database Schema & Security Setup
-- Run this entire script in your Supabase Project -> SQL Editor -> Run
-- ==============================================================================

-- 1. Aggregated stats table (for fast queries of total claps & unique views)
create table if not exists public.post_stats (
  post_slug text primary key,
  claps_count integer default 0,
  views_count integer default 0,
  country_views jsonb default '{}'::jsonb
);

-- Ensure migration compatibility for existing tables:
alter table if exists public.post_stats add column if not exists country_views jsonb default '{}'::jsonb;


-- 2. Anonymous claps table (Medium-style: up to 10 claps per visitor per post)
create table if not exists public.post_claps (
  id uuid default gen_random_uuid() primary key,
  post_slug text not null,
  visitor_id text not null,
  count integer default 1 check (count >= 1 and count <= 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (post_slug, visitor_id)
);

-- 3. Comments table (supporting both Google & GitHub authenticated readers)
create table if not exists public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_slug text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_name text not null,
  user_avatar text,
  provider text, -- 'github' or 'google'
  content text not null check (char_length(content) between 2 and 2000),
  created_at timestamptz default now()
);

-- 4. Enable Row Level Security (RLS) on all tables
alter table public.post_stats enable row level security;
alter table public.post_claps enable row level security;
alter table public.post_comments enable row level security;

-- 5. Row Level Security Policies
-- Everyone (anonymous + authenticated) can view stats, claps, and comments
drop policy if exists "Public read stats" on public.post_stats;
create policy "Public read stats" on public.post_stats for select using (true);

drop policy if exists "Public read claps" on public.post_claps;
create policy "Public read claps" on public.post_claps for select using (true);

drop policy if exists "Public read comments" on public.post_comments;
create policy "Public read comments" on public.post_comments for select using (true);

-- Only authenticated readers can post comments (verified by their user_id)
drop policy if exists "Authenticated users can comment" on public.post_comments;
create policy "Authenticated users can comment" on public.post_comments 
for insert to authenticated 
with check (auth.uid() = user_id);

-- Authors can delete their own comments
drop policy if exists "Users can delete own comments" on public.post_comments;
create policy "Users can delete own comments" on public.post_comments 
for delete to authenticated 
using (auth.uid() = user_id);

-- 6. Atomic RPC Function: Medium-Style Claps (increments up to 10 claps max per visitor)
create or replace function public.add_clap(p_slug text, p_visitor_id text)
returns json
language plpgsql
security definer
as $$
declare
  v_user_claps integer := 0;
  v_total_claps integer := 0;
begin
  -- Look up existing claps from this visitor for this post
  select count into v_user_claps 
  from public.post_claps 
  where post_slug = p_slug and visitor_id = p_visitor_id;
  
  if v_user_claps is null then
    -- First clap
    insert into public.post_claps (post_slug, visitor_id, count) 
    values (p_slug, p_visitor_id, 1);
    v_user_claps := 1;
    
    insert into public.post_stats (post_slug, claps_count, views_count)
    values (p_slug, 1, 0)
    on conflict (post_slug) do update set claps_count = public.post_stats.claps_count + 1
    returning claps_count into v_total_claps;
  elsif v_user_claps < 10 then
    -- Increment up to max 10 claps
    update public.post_claps 
    set count = count + 1, updated_at = now()
    where post_slug = p_slug and visitor_id = p_visitor_id
    returning count into v_user_claps;
    
    update public.post_stats 
    set claps_count = claps_count + 1
    where post_slug = p_slug
    returning claps_count into v_total_claps;
  else
    -- Cap reached (10 claps max per visitor)
    select claps_count into v_total_claps from public.post_stats where post_slug = p_slug;
  end if;

  return json_build_object(
    'user_claps', coalesce(v_user_claps, 0),
    'total_claps', coalesce(v_total_claps, 0),
    'max_reached', (coalesce(v_user_claps, 0) >= 10)
  );
end;
$$;

-- 7. Atomic RPC Function: Unique Views Counter with Geographic Tracking
drop function if exists public.record_view(text);
drop function if exists public.record_view(text, text);

create or replace function public.record_view(p_slug text, p_country text default 'UNKNOWN')
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
  v_c text := upper(coalesce(nullif(trim(p_country), ''), 'UNKNOWN'));
begin
  insert into public.post_stats (post_slug, views_count, claps_count, country_views)
  values (p_slug, 1, 0, jsonb_build_object(v_c, 1))
  on conflict (post_slug) do update set 
    views_count = public.post_stats.views_count + 1,
    country_views = jsonb_set(
      coalesce(public.post_stats.country_views, '{}'::jsonb),
      array[v_c],
      to_jsonb(coalesce((public.post_stats.country_views->>v_c)::integer, 0) + 1)
    )
  returning views_count into v_count;
  
  return v_count;
end;
$$;

-- 8. Grant Execution to anon & authenticated roles for atomic functions
grant execute on function public.add_clap(text, text) to anon, authenticated;
grant execute on function public.record_view(text, text) to anon, authenticated;


-- ==============================================================================
-- 9. Developer Tools Usage Analytics & Insights (Free-Tier Safe & Throttled)
-- ==============================================================================

-- 9.1 Raw Tool Events (Insert-only via RPC, rate-limited)
create table if not exists public.tool_events (
  id uuid default gen_random_uuid() primary key,
  tool_slug text not null,              -- 'pii-scrubber', 'jwt-debugger', 'json-formatter', 'daily-scroll'
  event_type text not null,             -- 'page_view', 'action'
  event_action text,                    -- 'scrub_text', 'copy_scrubbed', 'decode_jwt', 'verify_signature', etc.
  visitor_id text not null,             -- anonymous visitor UUID
  metadata jsonb default '{}',          -- { char_count: 1420, secrets_found: { api_key: 2, email: 4 } }
  created_at timestamptz default now()
);

-- 9.2 Aggregated Tool Lifetime Stats (Instant O(1) queries for dashboards)
create table if not exists public.tool_stats (
  tool_slug text primary key,
  total_views integer default 0,
  total_actions integer default 0,
  unique_visitors integer default 0,
  country_actions jsonb default '{}'::jsonb,
  last_used_at timestamptz default now()
);

-- Ensure migration compatibility for existing tables:
alter table if exists public.tool_stats add column if not exists country_actions jsonb default '{}'::jsonb;

-- 9.3 Tool Daily Rollups (for 30-day trend lines without scanning raw events)
create table if not exists public.tool_daily_stats (
  id uuid default gen_random_uuid() primary key,
  tool_slug text not null,
  date date not null default current_date,
  views integer default 0,
  actions integer default 0,
  unique (tool_slug, date)
);

-- Indexes for lightning fast queries
create index if not exists idx_tool_events_slug_created on public.tool_events(tool_slug, created_at desc);
create index if not exists idx_tool_events_visitor_created on public.tool_events(visitor_id, created_at desc);
create index if not exists idx_tool_daily_stats_date on public.tool_daily_stats(date desc);

-- Row Level Security
alter table public.tool_events enable row level security;
alter table public.tool_stats enable row level security;
alter table public.tool_daily_stats enable row level security;

-- Public can read aggregated stats for UI badges/counts
drop policy if exists "Public read tool stats" on public.tool_stats;
create policy "Public read tool stats" on public.tool_stats for select using (true);

drop policy if exists "Public read tool daily stats" on public.tool_daily_stats;
create policy "Public read tool daily stats" on public.tool_daily_stats for select using (true);

-- Authenticated users (admin) can read raw events for granular dashboard reports
drop policy if exists "Authenticated read tool events" on public.tool_events;
create policy "Authenticated read tool events" on public.tool_events for select to authenticated using (true);

-- 9.4 Atomic & Throttled RPC Function with Geographic Tracking
drop function if exists public.track_tool_event(text, text, text, text, jsonb);
drop function if exists public.track_tool_event(text, text, text, text, jsonb, text);

create or replace function public.track_tool_event(
  p_tool_slug text,
  p_event_type text,
  p_event_action text default null,
  p_visitor_id text default '',
  p_metadata jsonb default '{}',
  p_country text default 'UNKNOWN'
)
returns void
language plpgsql
security definer
as $$
declare
  v_last_event_time timestamptz;
  v_today date := current_date;
  v_c text := upper(coalesce(nullif(trim(p_country), ''), 'UNKNOWN'));
begin
  -- Validate tool slug
  if p_tool_slug not in ('pii-scrubber', 'jwt-debugger', 'json-formatter', 'daily-scroll', 'ats-checker') then
    return;
  end if;

  -- Validate event type
  if p_event_type not in ('page_view', 'action') then
    return;
  end if;

  -- Free-Tier Rate Limiting: drop bursts if same visitor triggered within last 3 seconds
  select created_at into v_last_event_time 
  from public.tool_events 
  where visitor_id = p_visitor_id and tool_slug = p_tool_slug 
  order by created_at desc 
  limit 1;

  if v_last_event_time is not null and (now() - v_last_event_time) < interval '3 seconds' then
    return; -- silently drop burst to protect DB storage
  end if;

  -- Insert raw event log
  insert into public.tool_events (tool_slug, event_type, event_action, visitor_id, metadata)
  values (p_tool_slug, p_event_type, p_event_action, p_visitor_id, p_metadata);

  -- Upsert Lifetime Rollup with Country Tracking
  insert into public.tool_stats (tool_slug, total_views, total_actions, unique_visitors, country_actions, last_used_at)
  values (
    p_tool_slug,
    case when p_event_type = 'page_view' then 1 else 0 end,
    case when p_event_type = 'action' then 1 else 0 end,
    1,
    case when p_event_type = 'action' then jsonb_build_object(v_c, 1) else '{}'::jsonb end,
    now()
  )
  on conflict (tool_slug) do update set
    total_views = tool_stats.total_views + case when p_event_type = 'page_view' then 1 else 0 end,
    total_actions = tool_stats.total_actions + case when p_event_type = 'action' then 1 else 0 end,
    country_actions = case 
      when p_event_type = 'action' then
        jsonb_set(
          coalesce(tool_stats.country_actions, '{}'::jsonb),
          array[v_c],
          to_jsonb(coalesce((tool_stats.country_actions->>v_c)::integer, 0) + 1)
        )
      else tool_stats.country_actions
    end,
    last_used_at = now();

  -- Upsert Daily Rollup
  insert into public.tool_daily_stats (tool_slug, date, views, actions)
  values (
    p_tool_slug,
    v_today,
    case when p_event_type = 'page_view' then 1 else 0 end,
    case when p_event_type = 'action' then 1 else 0 end
  )
  on conflict (tool_slug, date) do update set
    views = tool_daily_stats.views + case when p_event_type = 'page_view' then 1 else 0 end,
    actions = tool_daily_stats.actions + case when p_event_type = 'action' then 1 else 0 end;
end;
$$;

grant execute on function public.track_tool_event(text, text, text, text, jsonb, text) to anon, authenticated;




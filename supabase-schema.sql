-- ==============================================================================
-- DevScrolls: Supabase Database Schema & Security Setup
-- Run this entire script in your Supabase Project -> SQL Editor -> Run
-- ==============================================================================

-- 1. Aggregated stats table (for fast queries of total claps & unique views)
create table if not exists public.post_stats (
  post_slug text primary key,
  claps_count integer default 0,
  views_count integer default 0
);

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

-- 7. Atomic RPC Function: Unique Views Counter
create or replace function public.record_view(p_slug text)
returns integer
language plpgsql
security definer
as $$
declare
  v_count integer;
begin
  insert into public.post_stats (post_slug, views_count, claps_count)
  values (p_slug, 1, 0)
  on conflict (post_slug) do update set views_count = public.post_stats.views_count + 1
  returning views_count into v_count;
  
  return v_count;
end;
$$;

-- 8. Grant Execution to anon & authenticated roles for atomic functions
grant execute on function public.add_clap to anon, authenticated;
grant execute on function public.record_view to anon, authenticated;

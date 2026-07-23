-- 0002: engagement analytics, community chat groups, feedback
-- Run by hand in the Supabase SQL Editor after 0001_core.sql.

-- ============================================================
-- Engagement events: who clicked which ad / listing, and how
-- long they stayed (dwell_seconds). Anonymous events allowed
-- (session_id groups them pre-signup so we can "get to the person").
-- ============================================================
create table if not exists engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  event_type text not null check (event_type in ('ad_click','ad_impression','listing_view','listing_click','screen_view','quiz_start','apply_start')),
  ref_type text not null check (ref_type in ('ad','batch','screen','quiz')),
  ref_id text not null,               -- ad id / batch slug / screen name
  dwell_seconds int check (dwell_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_engagement_ref on engagement_events (ref_type, ref_id, created_at);
create index if not exists idx_engagement_user on engagement_events (user_id, created_at);
create index if not exists idx_engagement_session on engagement_events (session_id);

alter table engagement_events enable row level security;
-- Anyone (incl. anon key) may record events; only admins may read.
create policy engagement_insert on engagement_events
  for insert with check (true);
create policy engagement_admin_read on engagement_events
  for select using (is_admin());

-- ============================================================
-- Community chat: admin-managed groups per batch.
--   kind 'interested' — users who applied / expressed interest
--   kind 'confirmed'  — users who have PAID (deposit verified);
--                       auto-pulled in by trigger below.
-- ============================================================
create table if not exists chat_groups (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches(id) on delete cascade,
  kind text not null check (kind in ('interested','confirmed')),
  name text not null,
  is_active bool not null default true,
  created_at timestamptz not null default now(),
  unique (batch_id, kind)
);

create table if not exists chat_members (
  group_id uuid not null references chat_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references chat_groups(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_group on chat_messages (group_id, created_at);

alter table chat_groups enable row level security;
alter table chat_members enable row level security;
alter table chat_messages enable row level security;

create or replace function is_group_member(g uuid) returns boolean
language sql security definer stable as $$
  select exists (select 1 from chat_members where group_id = g and user_id = auth.uid());
$$;

-- Members see their groups; admins see all. Membership writes: service role/trigger only.
create policy chat_groups_member_read on chat_groups
  for select using (is_group_member(id) or is_admin());
create policy chat_members_self_read on chat_members
  for select using (user_id = auth.uid() or is_admin());
create policy chat_messages_member_read on chat_messages
  for select using (is_group_member(group_id) or is_admin());
create policy chat_messages_member_write on chat_messages
  for insert with check (sender_id = auth.uid() and is_group_member(group_id));

-- Auto-membership:
--  * application created            -> join batch 'interested' group
--  * deposit paid (status advances) -> pulled into 'confirmed' group
create or replace function sync_chat_membership() returns trigger
language plpgsql security definer as $$
declare g_id uuid;
begin
  -- ensure groups exist for the batch
  insert into chat_groups (batch_id, kind, name)
    select new.batch_id, k.kind,
           (select name from batches b where b.id = new.batch_id) ||
           case k.kind when 'interested' then ' · Interested' else ' · Travelers' end
    from (values ('interested'),('confirmed')) as k(kind)
  on conflict (batch_id, kind) do nothing;

  select id into g_id from chat_groups where batch_id = new.batch_id and kind = 'interested';
  insert into chat_members (group_id, user_id) values (g_id, new.user_id)
  on conflict do nothing;

  if new.status in ('screening','approved','balance_paid','matched') then
    select id into g_id from chat_groups where batch_id = new.batch_id and kind = 'confirmed';
    insert into chat_members (group_id, user_id) values (g_id, new.user_id)
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_sync_chat_membership on applications;
create trigger trg_sync_chat_membership
  after insert or update of status on applications
  for each row execute function sync_chat_membership();

-- ============================================================
-- Feedback / queries (also searchable by the Tia chatbot, read-only)
-- ============================================================
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('feedback','query','complaint')),
  subject text not null,
  body text not null,
  status text not null check (status in ('open','in_progress','resolved')) default 'open',
  created_at timestamptz not null default now()
);
alter table feedback enable row level security;
create policy feedback_owner_read on feedback for select using (user_id = auth.uid() or is_admin());
create policy feedback_owner_insert on feedback for insert with check (user_id = auth.uid());
create policy feedback_admin_update on feedback for update using (is_admin());

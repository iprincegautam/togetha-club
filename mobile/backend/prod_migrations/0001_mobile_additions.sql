-- ============================================================================
-- prod_migrations/0001_mobile_additions.sql
-- Togetha MOBILE additions to the SHARED production Supabase (togetha.club).
--
-- RUN BY HAND in the Supabase SQL Editor. There is no automatic runner.
--
-- STRICTLY ADDITIVE. This file:
--   * never ALTERs or DROPs any existing website table, policy, or data,
--     with TWO deliberate, additive exceptions you must confirm before running:
--       (1) `alter table profiles add column if not exists ...` — adds
--           is_verified + verification_status to the SHARED profiles table
--           (nullable-safe defaults; existing rows unaffected).
--       (2) ONE trigger on the SHARED applicants table (chat auto-membership).
--           It is wrapped in BEGIN/EXCEPTION so it can NEVER raise and NEVER
--           break the website's payment flow. See the loud comment below.
--   * adds new mobile-only tables, all with RLS enabled and policies named
--     mobile_* to avoid collisions with website policy names.
--
-- Admin on prod = profiles.role in ('super_admin','ops') (no admin_users table).
--
-- Storage buckets (create via Dashboard, NOT here):
--   * 'trip-photos'       — keep PRIVATE; serve via signed URLs even for
--                           approved photos (moderation-safe). Do not enable
--                           public read.
--   * 'verification-docs' — PRIVATE. Never public.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: mobile admin check (website admin = super_admin/ops on profiles)
-- ---------------------------------------------------------------------------
create or replace function is_mobile_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role::text in ('super_admin','ops')
  );
$$;

-- ---------------------------------------------------------------------------
-- Owner-read policy on the EXISTING applicants table (additive: CREATE POLICY
-- only — existing website policies untouched). Members see their own funnel
-- record via profiles.applicant_id.
-- ---------------------------------------------------------------------------
drop policy if exists mobile_applicants_owner_read on applicants;
create policy mobile_applicants_owner_read on applicants
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.applicant_id = applicants.id
    )
  );

-- ---------------------------------------------------------------------------
-- trip_photos — member-uploaded trip photos, moderated.
-- ---------------------------------------------------------------------------
create table if not exists trip_photos (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete cascade,
  batch_slug text references batches(slug),
  storage_path text not null,             -- path in private 'trip-photos' bucket
  caption text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','featured')),
  consent_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_mobile_trip_photos_batch on trip_photos (batch_slug, status);
create index if not exists idx_mobile_trip_photos_uploader on trip_photos (uploader_id);

alter table trip_photos enable row level security;
drop policy if exists mobile_trip_photos_public_read on trip_photos;
create policy mobile_trip_photos_public_read on trip_photos
  for select using (status in ('approved','featured'));
drop policy if exists mobile_trip_photos_owner_read on trip_photos;
create policy mobile_trip_photos_owner_read on trip_photos
  for select using (uploader_id = auth.uid());
drop policy if exists mobile_trip_photos_owner_insert on trip_photos;
create policy mobile_trip_photos_owner_insert on trip_photos
  for insert with check (uploader_id = auth.uid() and consent_confirmed = true);
drop policy if exists mobile_trip_photos_admin_all on trip_photos;
create policy mobile_trip_photos_admin_all on trip_photos
  for all using (is_mobile_admin()) with check (is_mobile_admin());

-- ---------------------------------------------------------------------------
-- photo_reports — user reports against photos.
-- ---------------------------------------------------------------------------
create table if not exists photo_reports (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references trip_photos(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);
alter table photo_reports enable row level security;
drop policy if exists mobile_photo_reports_insert on photo_reports;
create policy mobile_photo_reports_insert on photo_reports
  for insert with check (reporter_id = auth.uid());
drop policy if exists mobile_photo_reports_admin_read on photo_reports;
create policy mobile_photo_reports_admin_read on photo_reports
  for select using (is_mobile_admin());

-- ---------------------------------------------------------------------------
-- Community chat: groups per batch (interested / confirmed), members, messages.
-- Membership writes go through the trigger below / service role only.
-- ---------------------------------------------------------------------------
create table if not exists chat_groups (
  id uuid primary key default gen_random_uuid(),
  batch_slug text not null references batches(slug),
  kind text not null check (kind in ('interested','confirmed')),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (batch_slug, kind)
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
create index if not exists idx_mobile_chat_messages_group
  on chat_messages (group_id, created_at);

create or replace function is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from chat_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

alter table chat_groups enable row level security;
alter table chat_members enable row level security;
alter table chat_messages enable row level security;

drop policy if exists mobile_chat_groups_member_read on chat_groups;
create policy mobile_chat_groups_member_read on chat_groups
  for select using (is_group_member(id) or is_mobile_admin());

drop policy if exists mobile_chat_members_self_read on chat_members;
create policy mobile_chat_members_self_read on chat_members
  for select using (user_id = auth.uid() or is_group_member(group_id) or is_mobile_admin());
-- No insert/update/delete policies on chat_members: writes happen only via
-- the security-definer trigger below or the service role.

drop policy if exists mobile_chat_messages_member_read on chat_messages;
create policy mobile_chat_messages_member_read on chat_messages
  for select using (is_group_member(group_id) or is_mobile_admin());
drop policy if exists mobile_chat_messages_member_insert on chat_messages;
create policy mobile_chat_messages_member_insert on chat_messages
  for insert with check (sender_id = auth.uid() and is_group_member(group_id));

-- ---------------------------------------------------------------------------
-- engagement_events — analytics; inserts open (service role writes them
-- anyway via edge function), reads admin-only.
-- ---------------------------------------------------------------------------
create table if not exists engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  event_type text not null check (event_type in
    ('ad_click','ad_impression','listing_view','listing_click','screen_view','quiz_start','apply_start')),
  ref_type text not null check (ref_type in ('ad','batch','screen','quiz')),
  ref_id text not null,
  dwell_seconds integer check (dwell_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_mobile_engagement_type_time
  on engagement_events (event_type, created_at);
create index if not exists idx_mobile_engagement_ref
  on engagement_events (ref_type, ref_id);
create index if not exists idx_mobile_engagement_session
  on engagement_events (session_id);

alter table engagement_events enable row level security;
drop policy if exists mobile_engagement_insert on engagement_events;
create policy mobile_engagement_insert on engagement_events
  for insert with check (true);
drop policy if exists mobile_engagement_admin_read on engagement_events;
create policy mobile_engagement_admin_read on engagement_events
  for select using (is_mobile_admin());

-- ---------------------------------------------------------------------------
-- feedback — member feedback / queries / complaints.
-- ---------------------------------------------------------------------------
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('feedback','query','complaint')),
  subject text,
  body text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
alter table feedback enable row level security;
drop policy if exists mobile_feedback_owner_read on feedback;
create policy mobile_feedback_owner_read on feedback
  for select using (user_id = auth.uid() or is_mobile_admin());
drop policy if exists mobile_feedback_owner_insert on feedback;
create policy mobile_feedback_owner_insert on feedback
  for insert with check (user_id = auth.uid());
drop policy if exists mobile_feedback_admin_update on feedback;
create policy mobile_feedback_admin_update on feedback
  for update using (is_mobile_admin());

-- ---------------------------------------------------------------------------
-- push_tokens — device push notification tokens.
-- ---------------------------------------------------------------------------
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('ios','android')),
  token text not null unique,
  created_at timestamptz not null default now()
);
alter table push_tokens enable row level security;
drop policy if exists mobile_push_tokens_owner_all on push_tokens;
create policy mobile_push_tokens_owner_all on push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ADDITIVE columns on the SHARED profiles table — CONFIRM BEFORE RUNNING.
-- add column if not exists with defaults: existing website rows/queries are
-- unaffected; website code never selects these columns.
-- ---------------------------------------------------------------------------
alter table profiles
  add column if not exists is_verified boolean not null default false;
alter table profiles
  add column if not exists verification_status text not null default 'not_started'
    check (verification_status in ('not_started','submitted','verified','rejected'));

-- ---------------------------------------------------------------------------
-- verification_submissions — identity verification (mobile Safety page).
-- Sensitive: only masked numbers stored; docs in private 'verification-docs'.
-- ---------------------------------------------------------------------------
create table if not exists verification_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  linkedin_url text,
  instagram_handle text,
  company_name text,
  gov_id_last4 text check (gov_id_last4 ~ '^[0-9]{4}$'),
  pan_masked text,                       -- e.g. 'XXXXX123X' — never the full PAN
  gov_id_storage_path text,              -- private bucket path
  status text not null default 'submitted'
    check (status in ('submitted','verified','rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists idx_mobile_verification_user
  on verification_submissions (user_id, created_at);

alter table verification_submissions enable row level security;
drop policy if exists mobile_verification_owner_read on verification_submissions;
create policy mobile_verification_owner_read on verification_submissions
  for select using (user_id = auth.uid() or is_mobile_admin());
drop policy if exists mobile_verification_owner_insert on verification_submissions;
create policy mobile_verification_owner_insert on verification_submissions
  for insert with check (user_id = auth.uid());
drop policy if exists mobile_verification_admin_update on verification_submissions;
create policy mobile_verification_admin_update on verification_submissions
  for update using (is_mobile_admin());

create or replace function apply_mobile_verification_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    update profiles set is_verified = true, verification_status = 'verified'
      where id = new.user_id;
    new.reviewed_at := now();
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    update profiles set verification_status = 'rejected' where id = new.user_id;
    new.reviewed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_mobile_verification_review on verification_submissions;
create trigger trg_mobile_verification_review
  before update of status on verification_submissions
  for each row execute function apply_mobile_verification_review();

-- ===========================================================================
-- !!! THE ONE TRIGGER ON A SHARED WEBSITE TABLE — READ CAREFULLY !!!
--
-- Chat auto-membership on `applicants` (AFTER insert / update of status).
-- The website writes applicants via service role during the PAYMENT FLOW, so
-- this function is fully defensive: the entire body is wrapped in
-- BEGIN ... EXCEPTION WHEN OTHERS THEN NULL — it can NEVER raise, and
-- therefore can never break an applicant insert or a payment status update.
--
-- Behavior:
--   * ensures 'interested' + 'confirmed' chat groups exist for the batch_slug
--   * looks up the member's auth user via profiles.applicant_id = new.id
--     (a profile may not exist yet at insert time — silently skipped)
--   * adds them to 'interested' on insert, and to 'confirmed' when status
--     lands in ('deposit_paid','paid','approved')
-- ===========================================================================
create or replace function mobile_chat_membership_sync() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
  v_interested uuid;
  v_confirmed uuid;
begin
  begin
    if new.batch_slug is null then
      return new;
    end if;

    -- Ensure both groups exist for this batch (no-op if present).
    insert into chat_groups (batch_slug, kind, name)
    values
      (new.batch_slug, 'interested', new.batch_slug || ' — interested'),
      (new.batch_slug, 'confirmed',  new.batch_slug || ' — confirmed')
    on conflict (batch_slug, kind) do nothing;

    select id into v_interested from chat_groups
      where batch_slug = new.batch_slug and kind = 'interested';
    select id into v_confirmed from chat_groups
      where batch_slug = new.batch_slug and kind = 'confirmed';

    -- The applicant's auth user, if a profile is linked yet.
    select id into v_user from profiles where applicant_id = new.id limit 1;
    if v_user is null then
      return new;
    end if;

    if tg_op = 'INSERT' and v_interested is not null then
      insert into chat_members (group_id, user_id)
      values (v_interested, v_user)
      on conflict do nothing;
    end if;

    if new.status in ('deposit_paid','paid','approved') and v_confirmed is not null then
      insert into chat_members (group_id, user_id)
      values (v_confirmed, v_user)
      on conflict do nothing;
    end if;
  exception when others then
    -- NEVER propagate: the website's applicant/payment writes must not fail
    -- because of mobile chat bookkeeping.
    null;
  end;
  return new;
end $$;

drop trigger if exists trg_mobile_chat_membership on applicants;
create trigger trg_mobile_chat_membership
  after insert or update of status on applicants
  for each row execute function mobile_chat_membership_sync();

-- ============================================================================
-- End. Reminder: create 'trip-photos' (private, signed URLs) and
-- 'verification-docs' (private) storage buckets via the Dashboard.
-- ============================================================================

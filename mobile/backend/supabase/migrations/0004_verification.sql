-- 0004: identity verification submissions (backs the Safety page's hand-check)
-- Run by hand in the Supabase SQL Editor after 0003.

alter table profiles
  add column if not exists verification_status text not null default 'not_started'
    check (verification_status in ('not_started','submitted','verified','rejected'));

-- Document data is sensitive: numbers stored MASKED (last 4 only), files in a
-- private storage bucket ('verification-docs', dashboard-created, no public read).
create table if not exists verification_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  linkedin_url text,
  instagram_handle text,
  company_name text,
  gov_id_last4 text check (gov_id_last4 ~ '^[0-9]{4}$'),
  pan_masked text,                       -- e.g. 'XXXXX123X' — never the full PAN
  gov_id_storage_path text,              -- private bucket path
  status text not null default 'submitted' check (status in ('submitted','verified','rejected')),
  reviewer_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists idx_verification_user on verification_submissions (user_id, created_at);

alter table verification_submissions enable row level security;
create policy verification_owner_read on verification_submissions
  for select using (user_id = auth.uid() or is_admin());
create policy verification_owner_insert on verification_submissions
  for insert with check (user_id = auth.uid());
create policy verification_admin_update on verification_submissions
  for update using (is_admin());

-- Public surface: ONLY the boolean badge. Expose via profiles.is_verified which
-- admins flip when a submission is verified (service role / admin update).
-- (profiles.is_verified already exists from 0001.)
create or replace function apply_verification_review() returns trigger
language plpgsql security definer as $$
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    update profiles set is_verified = true, verification_status = 'verified'
      where id = new.user_id;
    new.reviewed_at := now();
  elsif new.status = 'rejected' then
    update profiles set verification_status = 'rejected' where id = new.user_id;
    new.reviewed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_apply_verification_review on verification_submissions;
create trigger trg_apply_verification_review
  before update of status on verification_submissions
  for each row execute function apply_verification_review();

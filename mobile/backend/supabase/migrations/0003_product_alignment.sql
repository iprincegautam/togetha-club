-- 0003: align mobile backend with production Togetha.Club product semantics.
-- Run by hand in the Supabase SQL Editor after 0002_engagement_chat.sql.
--
-- Encodes the real product model:
--   * 5 real batches (batch-a .. batch-e), GenZ 18-25 / Millennial 26-36,
--     per-gender capacity 12/12, deposit 30%, batch-c waitlist-only.
--   * Application pipeline: pending -> deposit_paid -> paid -> approved
--     (or rejected / expired). kyc pipeline: pending -> submitted -> approved/rejected.
--   * Alternating Friday departures (batch_departures).
--   * 48h balance window after profile approval (balance_deadline_at; missed -> expired).

-- ============================================================
-- batches: new product columns (data-safe; old columns kept)
-- ============================================================
alter table public.batches
  alter column price_inr drop not null,
  alter column deposit_inr drop not null;

alter table public.batches
  add column if not exists edition text
    check (edition in ('genz','millennial','mystery')),
  add column if not exists status text not null default 'open'
    check (status in ('open','sold_out','waitlist','coming_soon')),
  add column if not exists deposit_percent int not null default 30,
  add column if not exists age_min int,
  add column if not exists age_max int,
  add column if not exists max_spots_m int not null default 12,
  add column if not exists max_spots_f int not null default 12;

-- ============================================================
-- applications: real status pipeline + kyc + payment tracking
-- ============================================================
-- Map any legacy statuses to the new vocabulary before tightening the check.
alter table public.applications drop constraint if exists applications_status_check;

update public.applications set status = case status
  when 'applied'      then 'pending'
  when 'screening'    then 'deposit_paid'
  when 'balance_paid' then 'paid'
  when 'matched'      then 'approved'
  else status
end
where status in ('applied','screening','balance_paid','matched');

alter table public.applications
  alter column status set default 'pending';

alter table public.applications
  add constraint applications_status_check
  check (status in ('pending','deposit_paid','paid','approved','rejected','expired'));

alter table public.applications
  add column if not exists kyc_status text not null default 'pending'
    check (kyc_status in ('pending','submitted','approved','rejected')),
  add column if not exists payment_plan text not null default 'deposit'
    check (payment_plan in ('deposit','full')),
  add column if not exists amount_paid_paise int not null default 0,
  add column if not exists balance_due_paise int not null default 0,
  add column if not exists quiz_score int,
  add column if not exists compatibility_vector jsonb,
  add column if not exists match_insight jsonb,
  add column if not exists profile_approved_at timestamptz,
  add column if not exists balance_deadline_at timestamptz,
  add column if not exists balance_reminder_sent_at timestamptz,
  add column if not exists slot_released_at timestamptz;

-- ============================================================
-- payments: allow 'full' plan payments + record exact paise
-- ============================================================
alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments
  add constraint payments_kind_check
  check (kind in ('deposit','full','balance'));
alter table public.payments
  add column if not exists amount_paise int;

create index if not exists applications_balance_deadline_idx
  on public.applications (balance_deadline_at)
  where balance_deadline_at is not null and status = 'deposit_paid';

-- ============================================================
-- batch_departures: alternating Friday departures per batch
-- ============================================================
create table if not exists public.batch_departures (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete cascade,
  label text not null,
  sublabel text,
  departure_date date not null,
  return_date date not null,
  status text not null default 'open'
    check (status in ('open','sold_out','cancelled')),
  spots_m int not null default 12,
  spots_f int not null default 12,
  spots_taken_m int not null default 0,
  spots_taken_f int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (batch_id, departure_date)
);

alter table public.batch_departures enable row level security;

create policy batch_departures_public_select on public.batch_departures
  for select using (status = 'open');
create policy batch_departures_admin_select on public.batch_departures
  for select using (public.is_admin());
create policy batch_departures_admin_insert on public.batch_departures
  for insert with check (public.is_admin());
create policy batch_departures_admin_update on public.batch_departures
  for update using (public.is_admin());
create policy batch_departures_admin_delete on public.batch_departures
  for delete using (public.is_admin());

-- ============================================================
-- waitlist (Mystery Edition / batch-c)
-- ============================================================
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  gender text check (gender in ('m','f','nb')),
  batch_slug text not null default 'batch-c',
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

create policy waitlist_public_insert on public.waitlist
  for insert with check (true);
create policy waitlist_admin_select on public.waitlist
  for select using (public.is_admin());

-- ============================================================
-- chat membership sync: confirmed group once PAID
--   interested  -> on application insert
--   confirmed   -> status in ('deposit_paid','paid','approved')
-- ============================================================
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

  if new.status in ('deposit_paid','paid','approved') then
    select id into g_id from chat_groups where batch_id = new.batch_id and kind = 'confirmed';
    insert into chat_members (group_id, user_id) values (g_id, new.user_id)
    on conflict do nothing;
  end if;
  return new;
end $$;

-- (trigger trg_sync_chat_membership from 0002 keeps pointing at this function)

-- ============================================================
-- Seed: the five real batches
-- ============================================================
insert into public.batches
  (slug, name, destination, description, price_inr, deposit_inr,
   edition, status, deposit_percent, age_min, age_max, max_spots_m, max_spots_f,
   capacity_m, capacity_f, is_open)
values
  ('batch-a', 'Himalayan Love Trail — GenZ Edition',
   'Manali · Kasol · Sissu', '5N/6D curated singles trip through the Himalayas, GenZ (18–25).',
   9999, 3000, 'genz', 'open', 30, 18, 25, 12, 12, 12, 12, true),
  ('batch-b', 'Himalayan Love Trail — Millennial Edition',
   'Manali · Kasol · Sissu', '5N/6D curated singles trip through the Himalayas, Millennial (26–36).',
   9999, 3000, 'millennial', 'open', 30, 26, 36, 12, 12, 12, 12, true),
  ('batch-c', 'Mystery Edition',
   null, 'Destination revealed to matched members only. Waitlist open.',
   null, null, 'mystery', 'coming_soon', 30, null, null, 12, 12, 12, 12, false),
  ('batch-d', 'Udaipur Love Trail — GenZ Edition',
   'Udaipur · Kumbhalgarh', '2N/3D curated singles trip through royal Rajasthan, GenZ (18–25).',
   13999, 4200, 'genz', 'open', 30, 18, 25, 12, 12, 12, 12, true),
  ('batch-e', 'Udaipur Love Trail — Millennial Edition',
   'Udaipur · Kumbhalgarh', '2N/3D curated singles trip through royal Rajasthan, Millennial (26–36).',
   13999, 4200, 'millennial', 'open', 30, 26, 36, 12, 12, 12, 12, true)
on conflict (slug) do nothing;

-- ============================================================
-- Seed: alternating Friday departures, Aug–Sep 2026
--   Himalayan (batch-a / batch-b): 5N/6D  -> return = departure + 5 days
--   Udaipur   (batch-d / batch-e): 2N/3D  -> return = departure + 2 days
--   GenZ editions take odd Fridays, Millennial the alternating ones.
-- ============================================================
insert into public.batch_departures
  (batch_id, label, sublabel, departure_date, return_date, sort_order)
select b.id, d.label, d.sublabel, d.departure_date, d.return_date, d.sort_order
from (values
  -- Himalayan — GenZ (batch-a)
  ('batch-a', 'Aug 7 Departure',  'Manali · Kasol · Sissu · 5N/6D', date '2026-08-07', date '2026-08-12', 1),
  ('batch-a', 'Aug 21 Departure', 'Manali · Kasol · Sissu · 5N/6D', date '2026-08-21', date '2026-08-26', 2),
  ('batch-a', 'Sep 4 Departure',  'Manali · Kasol · Sissu · 5N/6D', date '2026-09-04', date '2026-09-09', 3),
  ('batch-a', 'Sep 18 Departure', 'Manali · Kasol · Sissu · 5N/6D', date '2026-09-18', date '2026-09-23', 4),
  -- Himalayan — Millennial (batch-b)
  ('batch-b', 'Aug 14 Departure', 'Manali · Kasol · Sissu · 5N/6D', date '2026-08-14', date '2026-08-19', 1),
  ('batch-b', 'Aug 28 Departure', 'Manali · Kasol · Sissu · 5N/6D', date '2026-08-28', date '2026-09-02', 2),
  ('batch-b', 'Sep 11 Departure', 'Manali · Kasol · Sissu · 5N/6D', date '2026-09-11', date '2026-09-16', 3),
  ('batch-b', 'Sep 25 Departure', 'Manali · Kasol · Sissu · 5N/6D', date '2026-09-25', date '2026-09-30', 4),
  -- Udaipur — GenZ (batch-d)
  ('batch-d', 'Aug 7 Departure',  'Udaipur · Kumbhalgarh · 2N/3D', date '2026-08-07', date '2026-08-09', 1),
  ('batch-d', 'Aug 21 Departure', 'Udaipur · Kumbhalgarh · 2N/3D', date '2026-08-21', date '2026-08-23', 2),
  ('batch-d', 'Sep 4 Departure',  'Udaipur · Kumbhalgarh · 2N/3D', date '2026-09-04', date '2026-09-06', 3),
  ('batch-d', 'Sep 18 Departure', 'Udaipur · Kumbhalgarh · 2N/3D', date '2026-09-18', date '2026-09-20', 4),
  -- Udaipur — Millennial (batch-e)
  ('batch-e', 'Aug 14 Departure', 'Udaipur · Kumbhalgarh · 2N/3D', date '2026-08-14', date '2026-08-16', 1),
  ('batch-e', 'Aug 28 Departure', 'Udaipur · Kumbhalgarh · 2N/3D', date '2026-08-28', date '2026-08-30', 2),
  ('batch-e', 'Sep 11 Departure', 'Udaipur · Kumbhalgarh · 2N/3D', date '2026-09-11', date '2026-09-13', 3),
  ('batch-e', 'Sep 25 Departure', 'Udaipur · Kumbhalgarh · 2N/3D', date '2026-09-25', date '2026-09-27', 4)
) as d(batch_slug, label, sublabel, departure_date, return_date, sort_order)
join public.batches b on b.slug = d.batch_slug
on conflict (batch_id, departure_date) do nothing;

-- Togetha Mobile — core schema + RLS
-- Apply manually in the Supabase SQL Editor (no automatic migration runner).
-- NOTE: storage bucket 'trip-photos' is created via the Supabase dashboard
-- (private bucket; access mediated through trip_photos rows + signed URLs).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  destination text,
  description text,
  start_date date,
  end_date date,
  price_inr int not null,
  deposit_inr int not null,
  capacity_m int not null default 0,
  capacity_f int not null default 0,
  spots_taken_m int not null default 0,
  spots_taken_f int not null default 0,
  hero_image_url text,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  gender text check (gender in ('m', 'f', 'nb')),
  city text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete cascade,
  status text not null default 'applied'
    check (status in ('applied', 'screening', 'approved', 'rejected', 'balance_paid', 'matched')),
  answers jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  kind text not null check (kind in ('deposit', 'balance')),
  amount_inr int not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

create table public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users (id) on delete cascade,
  batch_id uuid references public.batches (id) on delete set null,
  storage_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'featured')),
  consent_confirmed boolean not null default false,
  caption text,
  created_at timestamptz not null default now()
);

create table public.photo_reports (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.trip_photos (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  token text unique not null,
  created_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin'
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index applications_user_id_idx on public.applications (user_id);
create index applications_batch_id_idx on public.applications (batch_id);
create index applications_status_idx on public.applications (status);
create index trip_photos_batch_id_idx on public.trip_photos (batch_id);
create index trip_photos_status_idx on public.trip_photos (status);

-- ---------------------------------------------------------------------------
-- is_admin() helper (security definer, checks admin_users)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.batches enable row level security;
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.payments enable row level security;
alter table public.quiz_responses enable row level security;
alter table public.trip_photos enable row level security;
alter table public.photo_reports enable row level security;
alter table public.push_tokens enable row level security;
alter table public.admin_users enable row level security;

-- batches: public read of open batches
create policy "batches_public_select" on public.batches
  for select using (is_open);

-- profiles: owner read + insert (updates via service role only)
create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_owner_insert" on public.profiles
  for insert with check (auth.uid() = id);

-- applications: owner read + insert; admin read/update
create policy "applications_owner_select" on public.applications
  for select using (auth.uid() = user_id);
create policy "applications_owner_insert" on public.applications
  for insert with check (auth.uid() = user_id);
create policy "applications_admin_select" on public.applications
  for select using (public.is_admin());
create policy "applications_admin_update" on public.applications
  for update using (public.is_admin());

-- payments: owner read (via own application) + admin read/update.
-- Inserts happen through the create-order edge function (service role).
create policy "payments_owner_select" on public.payments
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
  );
create policy "payments_admin_select" on public.payments
  for select using (public.is_admin());
create policy "payments_admin_update" on public.payments
  for update using (public.is_admin());

-- quiz_responses: owner read + insert (anonymous rows only via service role)
create policy "quiz_responses_owner_select" on public.quiz_responses
  for select using (auth.uid() = user_id);
create policy "quiz_responses_owner_insert" on public.quiz_responses
  for insert with check (auth.uid() = user_id);

-- trip_photos: public read of approved/featured; uploader read own;
-- uploader insert own only with explicit consent; admin read/update.
create policy "trip_photos_public_select" on public.trip_photos
  for select using (status in ('approved', 'featured'));
create policy "trip_photos_owner_select" on public.trip_photos
  for select using (auth.uid() = uploader_id);
create policy "trip_photos_owner_insert" on public.trip_photos
  for insert with check (auth.uid() = uploader_id and consent_confirmed = true);
create policy "trip_photos_admin_select" on public.trip_photos
  for select using (public.is_admin());
create policy "trip_photos_admin_update" on public.trip_photos
  for update using (public.is_admin());

-- photo_reports: reporter insert + read own
create policy "photo_reports_owner_select" on public.photo_reports
  for select using (auth.uid() = reporter_id);
create policy "photo_reports_owner_insert" on public.photo_reports
  for insert with check (auth.uid() = reporter_id);

-- push_tokens: owner read + insert (updates/deletes via service role only)
create policy "push_tokens_owner_select" on public.push_tokens
  for select using (auth.uid() = user_id);
create policy "push_tokens_owner_insert" on public.push_tokens
  for insert with check (auth.uid() = user_id);

-- admin_users: RLS enabled, no policies — no public access; service role only.

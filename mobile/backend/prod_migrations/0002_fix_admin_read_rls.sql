-- 0002_fix_admin_read_rls.sql
--
-- SECURITY FIX (run by hand in the Supabase SQL editor).
--
-- Several "*_admin_read" policies were written `FOR SELECT TO authenticated
-- USING (true)` — the comments say "admins", but USING (true) lets ANY signed-in
-- user read the ENTIRE table. Because RLS policies are OR-ed, these blanket-TRUE
-- policies override the correctly owner-scoped ones (e.g. applicants_member_read),
-- so today any authenticated app/web user can read every row of:
--     applicants        (names, emails, phones — PII of ~1,890 people)
--     waitlist          (emails)
--     influencers, promo_codes, promo_redemptions
--
-- This replaces each blanket TRUE with a real admin check against profiles.role.
-- Non-admin owners keep their existing member-scoped read policies, so nothing
-- a member should see is lost. Server-side reads via the SERVICE ROLE bypass RLS
-- and are unaffected (the admin dashboard keeps working if it uses the service
-- role; if it reads as the admin's own session, that admin must have role
-- 'super_admin' or 'ops' — which migration 004 already grants).
--
-- Safe/idempotent: only tightens SELECT policies. Run once; re-runnable.

-- A small helper so every policy checks admin the same way.
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'ops')
  );
$$;

-- applicants (PII) — the important one
drop policy if exists applicants_admin_read on applicants;
create policy applicants_admin_read on applicants
  for select to authenticated
  using (public.is_platform_admin());

-- waitlist (emails)
drop policy if exists waitlist_admin_read on waitlist;
create policy waitlist_admin_read on waitlist
  for select to authenticated
  using (public.is_platform_admin());

-- influencers
drop policy if exists influencers_admin_read on influencers;
create policy influencers_admin_read on influencers
  for select to authenticated
  using (public.is_platform_admin());

-- promo_codes
drop policy if exists promo_codes_admin_read on promo_codes;
create policy promo_codes_admin_read on promo_codes
  for select to authenticated
  using (public.is_platform_admin());

-- promo_redemptions
drop policy if exists promo_redemptions_admin_read on promo_redemptions;
create policy promo_redemptions_admin_read on promo_redemptions
  for select to authenticated
  using (public.is_platform_admin());

-- After running: verify (1) a normal member JWT reads only their own applicant,
-- (2) an admin (role super_admin/ops) still reads all, (3) the website admin
-- dashboard still loads (it uses the service role, so it should be unaffected).

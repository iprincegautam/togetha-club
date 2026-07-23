# Production Supabase schema (togetha.club — SHARED with mobile)

Decision (2026-07-22): the mobile app SHARES the website's production Supabase
project. Rules: **ADDITIVE changes only** — never alter/drop existing website
tables or policies; new mobile tables go in `prod_migrations/`. Migrations
0001–0004 in supabase/migrations/ are for the abandoned separate-project plan;
DO NOT run them on prod.

Live data as of today: applicants ≈ 1,890 rows. Treat every write with care.

## Existing tables the app uses (read-mostly)

### batches (PK = slug TEXT)
slug, name, price (INTEGER **rupees**, nullable), status ('open','sold_out','waitlist','coming_soon'),
spots_taken_m/f, max_spots_m/f (default 12), deposit_percent (default 30).
Slugs: batch-a, batch-b (Himalayan ₹9,999), batch-c (mystery), batch-d, batch-e (Udaipur ₹13,999).
RLS: public SELECT.

### batch_departures
id uuid, batch_slug → batches, label, sublabel, departure_date, return_date,
status ('open','sold_out','cancelled'), spots_m/f, spots_taken_m/f, sort_order.

### applicants (the funnel record — website writes via service role)
id uuid, email unique, name, phone, gender ('m'|'f'), batch_slug, date_choice,
departure_id, quiz_answers jsonb, quiz_score, compatibility_vector jsonb,
match_insight jsonb, status ('pending','deposit_paid','paid','approved','rejected','expired'),
payment_plan ('deposit'|'full'), amount_paid, balance_due, original_amount,
discount_amount, final_amount (all **paise**), kyc_status ('pending','submitted','approved','rejected'),
razorpay_order_id/payment_id, promo_code_id, influencer_id, priority_review,
profile_approved_at, balance_deadline_at (48h), balance_reminder_sent_at,
slot_released_at, lead_source, admin_notes, profile_completed_at.
RLS: admin-only read on website — mobile adds an owner-read policy via profiles.applicant_id (see prod migration).

### profiles (auth.users id PK)
email, full_name, display_name, role ('super_admin','ops','member','influencer'),
applicant_id → applicants, phone, city, bio, avatar_url, emergency_contact,
dietary_notes, instagram_handle, razorpay_customer_id, password_change_required.

### waitlist — email unique, gender, batch_slug (default batch-c).
### applicant_payments — ledger (payment_kind 'deposit'|'full'|'balance'|'claim', amount_paise).
### Others (website ops, don't touch): promo_codes, promo_redemptions, influencers,
email_* nurture tables, dm_*, notifications, support_*, intern_applications, content_items, …

## Admin check
Website has NO admin_users table — admin = profiles.role in ('super_admin','ops').
Mobile helper `is_mobile_admin()` must check that.

## Mobile-only additions (prod_migrations/0001_mobile_additions.sql)
trip_photos, photo_reports, chat_groups/chat_members/chat_messages (keyed by
batch_slug TEXT), engagement_events, feedback, push_tokens,
verification_submissions (+ additive profiles columns is_verified,
verification_status), applicants owner-read policy, chat auto-membership
trigger on applicants (interested on insert; confirmed on status in
('deposit_paid','paid','approved')).

## Payments
Razorpay LIVE keys exist in .env — NEVER used in dev. Payments stay mocked in
the app until rzp_test_ keys are provided; live keys go only into production
edge-function secrets at launch. Amount math: batches.price is rupees; charge
paise = price*100; deposit = deposit_percent (30%) of final amount.

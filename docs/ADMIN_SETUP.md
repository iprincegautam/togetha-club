# Platform setup — Phase 1 admin

Run migrations **002 → 005** in the Supabase SQL Editor (in order), or via `npm run db:migrate` when `SUPABASE_DB_URL` is set.

## Admin access

1. Create a user in **Supabase Auth** (or sign up once).
2. Grant admin role (pick one):

**Option A — SQL (recommended after migration 004):**
```sql
UPDATE profiles SET role = 'super_admin' WHERE lower(email) = lower('hello@togetha.club');
```

**Option B — Env bootstrap (until profiles exist):**
Set on Vercel / `.env.local`:
```
ADMIN_EMAILS=hello@togetha.club,ops@togetha.club
```
Comma-separated emails with admin access even before `profiles.role` is set.

## New admin sections

| Route | Purpose |
|-------|---------|
| `/admin` | Applicants list + review links |
| `/admin/applicants/[id]` | Detail, status, internal notes |
| `/admin/batches` | Price, status, spot counts |
| `/admin/batches/[slug]` | Departure dates (shown on site + apply) |
| `/admin/waitlist` | Batch C waitlist |
| `/admin/affiliates` | Influencers & promos (read-only) |

## Departure dates

After migration **005**, trip dates load from `batch_departures`. Edit them under **Admin → Batches → Manage departure dates**. The public batches page and apply form use DB dates with code fallback if the table is empty.

---

## Phase 2 — Member portal (migration 006)

Run `006_member_portal.sql` in Supabase SQL Editor.

| Route | Purpose |
|-------|---------|
| `/account/login` | Member sign-in (credentials emailed after payment) |
| `/account` | Booking status, trip details, pay balance |
| `/account/profile` | Profile + KYC info for ops review |

After payment, the system automatically:
1. Creates a Supabase Auth user (or links an existing one)
2. Links `profiles.applicant_id` to the booking
3. Emails login details via Resend (`RESEND_API_KEY` required)

Set `NEXT_PUBLIC_SITE_URL=https://togetha.club` on Vercel so login links in emails are correct.

---

## Auth — Member & Partner (migration 008)

Run `008_auth_otp.sql` in Supabase SQL Editor (stores OTP codes for Resend email verification).

### Member portal

| Route | Purpose |
|-------|---------|
| `/account/signup` | Create account (email OTP via Resend) |
| `/account/login` | Sign in |
| `/account/forgot-password` | Request 6-digit reset code |
| `/account/reset-password` | Enter OTP + new password |

Payment still auto-provisions accounts and sends welcome email. Signup also links an existing `applicants` row when emails match.

### Partner portal

| Route | Purpose |
|-------|---------|
| `/partner/signup` | Self-register or claim portal (creates `influencers` row + default promo if new) |
| `/partner/login` | Sign in |
| `/partner/forgot-password` | Request reset code |
| `/partner/reset-password` | Enter OTP + new password |

Admin **Create + email login** on `/admin/affiliates` now sends a partner welcome email via Resend.

### Email requirements

- `RESEND_API_KEY` on Vercel (OTP + welcome emails)
- `hello@togetha.club` domain verified in Resend
- Supabase **Auth → URL Configuration** add redirect: `https://togetha.club/auth/callback` (for optional email-link password reset)


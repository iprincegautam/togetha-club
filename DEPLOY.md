# Togetha.Club — Production Deploy Guide

Follow these steps in order before and after deploying to Vercel.

---

## 1. Supabase

### Run the migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Confirm three rows exist in **Table Editor → batches** (`batch-a`, `batch-b`, `batch-c`)

### Create admin user

1. **Authentication → Users → Add user**
2. Use your admin email and a strong password
3. Any authenticated Supabase user can access `/admin` (no role check yet)

### Copy keys to env

From **Project Settings → API**:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role secret key (never expose client-side) |

---

## 2. Razorpay (Live)

1. [Razorpay Dashboard](https://dashboard.razorpay.com/) → switch to **Live** mode
2. **Settings → API Keys** → generate live keys
3. Set on Vercel (and `.env.local` for local testing):

```
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
```

Use **Test** keys locally until you are ready for real charges.

---

## 3. Resend

1. [Resend Dashboard](https://resend.com/domains) → add and verify `togetha.club`
2. Add DNS records (SPF, DKIM) as instructed
3. Set `RESEND_API_KEY` on Vercel
4. Confirmation emails send from `hello@togetha.club` — domain must be verified first

---

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill all values:

```bash
cp .env.example .env.local
```

Required at build time (app throws if missing):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

Optional:

- `NEXT_PUBLIC_WHATSAPP_URL` — confirmation page CTA (has fallback)

---

## 5. Local smoke test

```bash
cd togetha-club
npm run build    # must pass
npm run start    # http://localhost:3000
```

Test flow:

1. Home → Quiz → submit
2. `/apply/batch-a` → 3 steps → Razorpay test payment
3. `/confirmation?batch=batch-a`
4. `/waitlist` → submit email
5. `/admin/login` → view applicants table

Verify in Supabase:

- Applicant row with `status: paid`
- `spots_taken_m` or `spots_taken_f` incremented on the correct batch
- Waitlist row inserted

---

## 6. Deploy to Vercel

1. Push repo to GitHub
2. [Vercel](https://vercel.com) → **Add New Project** → import repo
3. Set **Root Directory** to `togetha-club`
4. Add all env vars from section 4 for **Production** and **Preview**
5. Set `NEXT_PUBLIC_SITE_URL` to your production domain (e.g. `https://togetha.club`)
6. Deploy and confirm build logs show no `Missing env var` errors
7. Add custom domain under **Settings → Domains**

---

## 7. Production smoke test

Run the same flow as section 5 on the live URL:

```
quiz → apply → pay → confirmation → admin
```

Verify:

- [ ] Applicant row created with `status: paid`
- [ ] Spot count incremented on correct batch + gender
- [ ] Waitlist row inserted (if tested)
- [ ] Confirmation email delivered
- [ ] Waitlist email delivered (if tested)
- [ ] Admin dashboard shows applicants

---

## Security notes

- API routes use `SUPABASE_SERVICE_ROLE_KEY` for writes (bypasses RLS)
- Anon key is read-only via RLS (batches public read; applicants/waitlist admin read only)
- Dev fallbacks (`dev: true`, `dev_order_*`) are gated to `NODE_ENV === development` only

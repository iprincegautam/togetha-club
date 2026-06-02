# Togetha.Club

India's first matchmaking travel club — AI-matched singles, Himalayan batches, and a full apply-to-pay flow.

**Live:** [togetha.club](https://togetha.club) · **Preview:** [togetha-club.vercel.app](https://togetha-club.vercel.app) · **Repo:** [github.com/iprincegautam/togetha-club](https://github.com/iprincegautam/togetha-club)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, plain CSS |
| Database | Supabase (Postgres + Auth) |
| Payments | Razorpay |
| Email | Resend |
| Hosting | Vercel |

---

## Project structure

```
togetha-club/
├── src/
│   ├── app/                    # Routes & API handlers
│   │   ├── (marketing)/        # Public pages (home, batches, quiz, apply)
│   │   ├── (admin)/            # Admin dashboard + login
│   │   └── api/                # quiz, apply, payment, waitlist, admin
│   ├── components/             # UI by feature (home, batches, apply, admin)
│   ├── constants/              # Batch slugs, routes, quiz questions
│   ├── hooks/                  # Scroll reveal, smooth scroll
│   └── lib/                    # Supabase, Razorpay, Resend, env
├── supabase/
│   └── migrations/             # SQL schema + RLS (run in Supabase dashboard)
├── scripts/
│   └── smoke-test.sh           # HTTP smoke test (local or production)
├── .env.example                # Required environment variables template
├── DEPLOY.md                   # Full production deploy checklist
└── vercel.json                 # Vercel project config
```

---

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- [Razorpay](https://razorpay.com) account (test keys for local dev)
- [Resend](https://resend.com) account with verified domain
- [Vercel](https://vercel.com) account (for hosting)

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env.local

# 3. Run Supabase migration (see Database setup below)

# 4. Start dev server
npm run dev
# or clear cache if styles break:
npm run dev:fresh
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Copy `.env.example` → `.env.local` and fill every value:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; API writes |
| `NEXT_PUBLIC_SITE_URL` | Yes | `http://localhost:3000` locally, `https://togetha.club` in prod |
| `RAZORPAY_KEY_ID` | Prod | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Prod | Razorpay secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Prod | Same as `RAZORPAY_KEY_ID` (client checkout) |
| `RESEND_API_KEY` | Prod | Resend API key |
| `NEXT_PUBLIC_WHATSAPP_URL` | No | Confirmation page WhatsApp CTA |

Never commit `.env.local`.

---

## Database setup

1. Open your Supabase project → **SQL Editor**
2. Run the full contents of `supabase/migrations/001_initial_schema.sql`
3. Confirm **Table Editor** shows `batches`, `applicants`, `waitlist`
4. Create an admin user: **Authentication → Users → Add user**

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run dev:fresh` | Clear `.next` cache + dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |
| `./scripts/smoke-test.sh <url>` | Smoke test (e.g. `http://localhost:3000`) |

---

## Deploy

Deployed on **Vercel** with root directory `togetha-club`.

### First-time / manual deploy

```bash
vercel login
vercel link
vercel deploy --prod
```

Add all env vars in [Vercel → Project Settings → Environment Variables](https://vercel.com).

### Git push (auto-deploy)

Push to `main` on GitHub — Vercel rebuilds automatically when the repo is connected.

See **[DEPLOY.md](./DEPLOY.md)** for the full production checklist (Razorpay live keys, Resend domain, smoke tests).

### Custom domain (togetha.club)

Domains are added on Vercel. **You must update DNS** at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| A | `www` | `76.76.21.21` |

**Or** point nameservers to Vercel: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`.

DNS can take up to 48 hours. Check status in [Vercel → Domains](https://vercel.com/princes-projects-a8114053/togetha-club/settings/domains).

---

## User flows

```
Home → Quiz → Apply (batch-a/b) → Razorpay → Confirmation
Batches → Waitlist (batch-c)
Admin login → Applicants table
```

---

## License

Private — All rights reserved.

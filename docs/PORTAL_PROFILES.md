# Member & Partner portal — profile & settings plan

## Design principle

**Dashboard** = status, money, actions (pay balance, copy promo link).  
**Profile** = identity & trip/payout details ops needs.  
**Settings** = login email, password, sign out.

---

## Member portal (`/account/*`)

| Area | Route | Phase | Contents |
|------|-------|-------|----------|
| Dashboard | `/account` | ✅ Live | Booking pipeline, batch info, pay balance |
| Profile | `/account/profile` | ✅ + Phase 1 | Full name, **nickname**, **photo**, phone, city, bio, Instagram, emergency contact, dietary notes, KYC submit |
| Settings | `/account/settings` | Phase 1 | Current email, **change email (OTP)**, **change password**, sign out |
| Payments | `/account/payments` | ✅ Live | Saved cards via Razorpay Customer; pay balance with save option |
| Notifications | — | Phase 3 | Email/SMS prefs for trip updates |

### Member profile fields

| Field | Storage | Notes |
|-------|---------|-------|
| Photo | `profiles.avatar_url` + Storage `avatars/` | Shown in portal only until matching features ship |
| Nickname | `profiles.display_name` | Display name; legal name stays on applicant |
| Trip / KYC | existing profile + `applicants.kyc_status` | Unchanged |

### Member payments (live)

- Razorpay Customer on `profiles.razorpay_customer_id` (migration **010**)
- Checkout uses `customer_id` + `save: 1` for balance pay
- `/account/payments` lists and removes saved cards

---

## Partner / influencer portal (`/partner/*`)

| Area | Route | Phase | Contents |
|------|-------|-------|----------|
| Dashboard | `/partner` | ✅ Live | Stats, promo codes, earnings ledger |
| Profile & payout | `/partner/profile` | Phase 1 | Name, phone, bio, Instagram, **UPI**, **bank account** (for commission payout) |
| Settings | `/partner/settings` | Phase 1 | Email (OTP), password, sign out |
| Payments (card) | — | Phase 3 | Only if influencers pay for something; commissions are **payouts out**, not cards in |

### Partner payout fields

| Method | Storage | Admin use |
|--------|---------|-----------|
| UPI | `influencers.payout_upi` | Primary for India |
| Bank | `payout_account_holder`, `payout_account_number`, `payout_ifsc`, `payout_bank_name` | Manual bank transfer by ops |
| Card on file | — | **Not planned** for influencers (they receive money, not pay) |

### Partner profile vs settings

- **Profile** — what appears on statements and what ops uses to pay you  
- **Settings** — how you log in (auth)

---

## Admin visibility

- Member KYC: existing applicant detail in `/admin/applicants/[id]`
- Partner payout: full UPI + bank table on `/admin/affiliates` (live)

---

## Security notes

- Bank details are sensitive; only service-role APIs write them; partners read/update own row via API
- Email changes require OTP to the **new** address
- Password change via OTP reset or Supabase recovery link
- Never store full card PAN/CVV in our database

---

## Migration

Run **`009_portal_profiles.sql`** after 008.

Supabase Storage: create public bucket **`avatars`** (or run dashboard setup) for member photo uploads.

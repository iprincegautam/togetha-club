# Support Portal

Sales and support staff use a dedicated portal at **`/support/login`** to guide applicants through booking without full admin access.

## Architecture

| Portal | Route | Role |
|--------|-------|------|
| Admin | `/admin/login` | `ops`, `super_admin` |
| Support | `/support/login` | `support` + permissions |
| Member | `/account/login` | `member` |
| Partner | `/partner/login` | `influencer` |

Permissions are stored in `support_permissions` and managed from **Admin → Support staff** (`/admin/support-staff`).

## Onboarding a new support hire

1. Sign in to **Admin** (`/admin/login`).
2. Open **Support staff** in the sidebar.
3. Enter name, email, view scope, and permission checkboxes.
4. Click **Create support login →** — Resend emails a temporary password to their inbox.
5. Share the login URL: `https://togetha.club/support/login`
6. On first login they must set a personal password at `/support/change-password`.

### Default permissions (MVP bundle)

- View applicants
- Edit internal notes
- Change applicant status
- Provision direct member login
- Resend member credentials
- Send balance payment link

Grant **Approve profile / KYC**, **Waitlist**, or **DM annotations** explicitly if needed.

## Applicant assignment

On **Admin → Applicants → [detail]**, use **Support assignment** to assign a lead to a staff member.

- Staff with **assigned only** scope see only their assigned applicants.
- Staff with **all** scope see the full applicant list (same data, limited actions).
- Direct logins provisioned by support are auto-assigned to the provisioning staff member.

## Support staff day-to-day workflow

1. **Dashboard** (`/support`) — counts by booking stage and recent assigned applicants.
2. **Applicants** — search/filter list; open detail for contact info, quiz, payments.
3. **Direct login** — create pre-payment member account for WhatsApp/phone leads.
4. **Actions on applicant detail** (permission-gated):
   - Add internal notes
   - Resend member portal credentials
   - Send balance payment reminder email
   - Approve profile (if granted)

External communication (WhatsApp, phone) stays outside the app; the portal is the ops console.

## Database

Migration: `supabase/migrations/036_support_portal.sql`

- `user_role` enum: adds `support`
- `support_staff` — view scope, active flag
- `support_permissions` — granular grants
- `applicants.assigned_support_id` — lead assignment

## API routes

| Route | Purpose |
|-------|---------|
| `GET /api/support/me` | Session, permissions, staff settings |
| `GET /api/support/applicants` | Scoped applicant list |
| `GET/PATCH /api/support/applicants/[id]` | Detail, notes, status |
| `POST .../resend-credentials` | Member login reset |
| `POST .../send-balance-link` | Balance reminder email |
| `POST .../approve-profile` | KYC approval |
| `POST /api/support/members/provision` | Direct member login |
| `GET/POST /api/admin/support-staff` | Admin: list + provision |
| `PATCH /api/admin/support-staff/[id]` | Admin: permissions, scope, active |

## Security notes

- Support users cannot access `/admin` or `/api/admin`.
- Every support API checks role, active flag, permission, and applicant scope.
- Deactivated staff (`is_active = false`) are blocked at middleware and API layers.

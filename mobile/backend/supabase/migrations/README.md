# LEGACY — do not run on production

Migrations 0001–0004 here were written for the abandoned plan of a SEPARATE
mobile Supabase project. As of 2026-07-22 the mobile app SHARES the website's
production Supabase; the only migration that applies to prod is
`backend/prod_migrations/0001_mobile_additions.sql` (additive only, run by
hand). These files are kept for reference only.

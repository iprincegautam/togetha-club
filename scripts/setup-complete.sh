#!/usr/bin/env bash
# Finish production setup after Razorpay keys are configured.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT_URL="${1:-https://togetha.club}"

echo "=== Togetha setup check ==="

# Load .env.local
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local 2>/dev/null || export $(grep -v '^#' .env.local | xargs)
  set +a
fi

echo ""
echo "1) Supabase migration 002 (promo codes)"
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  echo "   Running via npm run db:migrate ..."
  npm run db:migrate
else
  echo "   SKIP: Add SUPABASE_DB_URL to .env.local, then: npm run db:migrate"
  echo "   Or run SQL manually:"
  echo "   https://supabase.com/dashboard/project/bqroebrlhndftkutsqbu/sql/new"
  echo "   File: supabase/migrations/002_promo_codes_affiliates.sql"
fi

echo ""
echo "2) Production smoke test ($ROOT_URL)"
./scripts/smoke-test.sh "$ROOT_URL"

echo ""
echo "3) Promo code API"
PROMO=$(curl -s -X POST "$ROOT_URL/api/promo/validate" \
  -H 'Content-Type: application/json' \
  -d '{"code":"SARAH200","batchSlug":"batch-a","originalAmount":1899900}')
echo "   $PROMO"
if echo "$PROMO" | grep -q '"valid":true'; then
  echo "   OK: SARAH200 works on production"
else
  echo "   WARN: Promo not valid yet — run migration 002 in Supabase"
fi

echo ""
echo "4) Razorpay on Vercel"
if vercel env ls 2>/dev/null | grep -q RAZORPAY_KEY_ID; then
  echo "   OK: Razorpay env vars present on Vercel"
else
  echo "   WARN: Add Razorpay keys on Vercel"
fi

echo ""
echo "5) Resend"
if [ -n "${RESEND_API_KEY:-}" ]; then
  echo "   Local RESEND_API_KEY is set"
  if ! vercel env ls 2>/dev/null | grep -q RESEND_API_KEY; then
    echo "   Add to Vercel: vercel env add RESEND_API_KEY production --value \"...\" --yes --force"
  fi
else
  echo "   SKIP: RESEND_API_KEY empty in .env.local (emails optional for now)"
fi

echo ""
echo "=== Done ==="

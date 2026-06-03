#!/usr/bin/env bash
# Production smoke test — run against your live URL:
#   ./scripts/smoke-test.sh https://togetha.club
#
# Requires: curl, jq (optional)

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
echo "Smoke testing: $BASE_URL"

echo "→ GET /"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$status" != "200" ]; then
  echo "FAIL: home returned $status"
  exit 1
fi
echo "OK: home ($status)"

echo "→ GET /batches"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/batches")
if [ "$status" != "200" ]; then
  echo "FAIL: batches returned $status"
  exit 1
fi
echo "OK: batches ($status)"

echo "→ GET /admin/login"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin/login")
if [ "$status" != "200" ]; then
  echo "FAIL: admin login returned $status"
  exit 1
fi
echo "OK: admin login ($status)"

echo "→ POST /api/promo/validate (SARAH200)"
promo_res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/promo/validate" \
  -H "Content-Type: application/json" \
  -d '{"code":"SARAH200","batchSlug":"batch-a","originalAmount":1899900}')
promo_status=$(echo "$promo_res" | tail -1)
promo_body=$(echo "$promo_res" | sed '$d')
if [ "$promo_status" != "200" ]; then
  echo "FAIL: promo validate returned $promo_status"
  exit 1
fi
if echo "$promo_body" | grep -q '"valid":true'; then
  echo "OK: promo SARAH200 ($promo_status)"
else
  echo "WARN: promo not valid — run migration 002 in Supabase SQL Editor"
  echo "     $promo_body"
fi

echo "→ POST /api/waitlist (invalid email)"
res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/waitlist" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email"}')
status=$(echo "$res" | tail -1)
if [ "$status" != "400" ]; then
  echo "FAIL: waitlist validation returned $status (expected 400)"
  exit 1
fi
echo "OK: waitlist validation ($status)"

echo ""
echo "Basic smoke passed. Manual checks still required:"
echo "  1. Quiz → apply → Razorpay pay → confirmation"
echo "  2. Supabase: applicant row status=paid, spots incremented"
echo "  3. Confirmation + waitlist emails delivered"
echo "  4. Admin login → applicants table loads"

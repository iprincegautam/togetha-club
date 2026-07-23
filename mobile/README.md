# Togetha Mobile

Native iOS + Android app for **Togetha.Club** — India's first matchmaking travel
club. Fully standalone: its own backend, its own env/keys, zero code shared with
any other Togetha property.

## The product truth (copy rule — non-negotiable)

> Quiz → Apply → **Deposit reserves a human-screening slot (24–36h)** → Balance → Matched onto a batch.

No screen, notification, or Tia reply may ever imply instant confirmation or a
guaranteed seat on deposit. Screening is the trust feature — show it, don't hide it.
The community is majority women; gender-balance bars, verified badges, and
admin-approved trip photos make that visible.

## Layout

```
design/tokens.json     shared design tokens (colors, type, spacing, springs) — source of truth for both apps
backend/               Supabase: migrations (run BY HAND in SQL Editor) + Deno edge functions
  supabase/migrations/0001_core.sql
  supabase/functions/{create-order, tia-chat, _shared}
ios/                   SwiftUI app (XcodeGen). `xcodegen generate` then build scheme "Togetha"
android/               Jetpack Compose app. `./gradlew assembleDebug`
```

## Setup

1. **Backend:** create a NEW Supabase project (never reuse the website's).
   Run `backend/supabase/migrations/0001_core.sql` in the SQL Editor. Create a
   `trip-photos` storage bucket. Copy `backend/.env.example` and set secrets via
   `supabase secrets set` (mobile-only Razorpay + Anthropic keys).
2. **iOS:** `brew install xcodegen && cd ios && xcodegen generate`, open
   `Togetha.xcodeproj`, build. iOS 17+, Swift 6.
3. **Android:** `cd android && ./gradlew assembleDebug` (wrapper included;
   `local.properties` needs `sdk.dir`). minSdk 26.

Phase 1 runs on `MockAPIClient` / `MockApiClient` — every screen navigable with
realistic data, mock checkout clearly labeled, no real money or network.
Live clients are wired but activate only when base URLs/keys are configured.

## Verification

- iOS: `xcodebuild -project Togetha.xcodeproj -scheme Togetha -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build`
- Android: `./gradlew assembleDebug`
- Edge functions: `deno check backend/supabase/functions/*/index.ts`

## Phase 2 (next plan)

Real auth (phone OTP + Apple/Google), Razorpay native SDKs, photo upload to
Storage + admin moderation console, push (APNs/FCM), Rive/Lottie signature
animations, Sentry + PostHog, CI (GitHub Actions + Fastlane), Razorpay webhook
as second payment-confirmation channel.

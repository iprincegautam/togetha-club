# Togetha Mobile — Whole-App Redesign Brief & Prompt

**Date:** 2026-07-22 · **Type:** Design prompt (north-star, built in slices)
**For:** a design/implementation agent, run WITH the installed skills
`design-taste-frontend` and `impeccable` (invoke them for every screen's visual pass).

> **How to use this document.** This is the product-flow north star for the whole
> app. It is NOT a single implementation plan — it spans several subsystems and
> ships in slices (see "Build order"). For each screen, first apply the visual
> taste skills, then implement against the specs here. Keep both platforms
> (SwiftUI / Compose) at pixel-parity via `design/tokens.json`.

---

## 0. Non-negotiables (apply to EVERY screen)

1. **The product truth — never violate it.** Quiz → Apply → **Deposit reserves a
   human-screening slot (24–36h)** → Balance → Matched onto a batch. No screen,
   badge, animation, or Tia reply may imply instant confirmation or a guaranteed
   seat on deposit. Screening is the trust feature — show it, don't hide it.
2. **The three messages every screen must carry:** (a) travel × matchmaking,
   (b) women-majority & trust-first — shown with *data* (gender-balance bars,
   verified badges, real photos), not just claimed, (c) screening is the product.
3. **Design system:** deep forest green + warm off-white + sunrise-amber accent,
   full dark mode; editorial serif headlines + clean grotesque UI; spring-based,
   functional motion only. Source of truth = `design/tokens.json`.
4. **Safety-first defaults on anything involving real people** (profiles, feed,
   chat). When in doubt, choose the more private / more gated option.
5. **Graceful fallback contract:** every screen must render on mock data when the
   backend is unconfigured, so both apps stay buildable without credentials.

---

## 1. The end-to-end flow (the new spine)

```
Sign up / Log in (phone OTP)
      │
      ▼
QUIZ  (no "which destination?" question — that's chosen later, by match %)
      │  saves quiz_answers, quiz_score, compatibility_vector, match_insight
      ▼
COMPATIBILITY REPORT  (the reward: your travel-compatibility profile, in-app)
      │
      ▼
DISCOVER  (every destination shows YOUR "% match")  ──►  BATCH DETAIL
      │                                                       │
      ▼                                                       ▼
APPLY to a batch  ──►  VERIFY (ID/KYC)  ──►  DEPOSIT (reserve screening slot)
      │
      ▼
JOURNEY (live state machine): Applied → In human review (24–36h)
      → Approved / Rejected → [approved] 48h balance window → Balance paid
      → Confirmed traveler → Trip → Post-trip (share to Feed)
      │
      ▼
FEED + PROFILES + CHAT  (community: post trips, discover people, batch groups)
```

**Key change from today:** the quiz no longer asks *where you want to go*.
You take the quiz to learn *who you are as a traveler*, then the app shows you
which destinations fit you, each ranked with a personal **match %**.

---

## 2. Screen-by-screen redesign

### 2.1 Auth (login / signup)
- Phone OTP primary (Apple/Google later). Browse-before-signup allowed; OTP gates
  quiz, apply, upload, chat.
- After first OTP, silently link to any existing website applicant by phone
  (see the separate auth design doc). New users proceed straight to the quiz.
- Warm, one-purpose screen. No password fields.

### 2.2 Quiz (curation) — **remove the destination question**
- One-question-per-screen, animated progress (Rive trail).
- Drop any "which trip / which destination / which city" question entirely.
- On completion: persist `quiz_answers`, compute + save `quiz_score`,
  `compatibility_vector`, and `match_insight` (mirror the website's semantics so a
  user who did the web quiz sees a consistent result).
- Honest framing: "This helps us see how you travel — and which trips fit you."
  Never "score to get in."
- Ends by pushing the user into the **Compatibility Report**, then Discover.

### 2.3 Compatibility Report (new in-app screen, parity with website)
- Shows the user their own travel-compatibility profile across the MatchEngine's
  dimensions (reuse `Core/Match/MatchEngine`): strengths, travel style,
  what kind of group they thrive in — as an editorial, shareable read.
- Positioned as insight, not judgment. No approval odds, ever.
- Entry points: right after the quiz, and permanently from Account → "My quiz &
  compatibility".

### 2.4 Discover + Batch Detail — **personal match % per destination**
- Every batch/destination card shows a **"NN% match"** badge for THIS user,
  computed from their `compatibility_vector` against the batch's target
  composition/vibe (extend MatchEngine with a `matchPercent(user, batch)`).
  - **DECIDED: match % comes from the app's own MatchEngine heuristic** (no
    dependency on the website's internal formula) — one shared, unit-tested
    `matchPercent(user, batch)`.
  - If the user hasn't taken the quiz yet: show "Take the quiz to see your match"
    instead of a number — never a fake %.
- Keep: immersive photo cards, gender-balance bar per batch, price/deposit,
  age-band, screening explainer, Apply CTA.
- Sort/ًhighlight by match % but never hide options; Mystery Edition stays
  waitlist-only.

### 2.5 Feed (redesign from the empty state)
- **Posting:** verified travelers post **photos, short videos, a location tag, and
  an experience caption** from a batch they traveled on.
  - Consent confirmation for anyone pictured; **every post goes to admin
    moderation (AI pre-flag → human approve) before it's public** — keep the
    current promise: "Every photo is reviewed before it appears."
- **Consuming:** a feed of approved posts (batch albums + curated highlights);
  report button on every post; tap a poster → open their **profile**.
- **DECIDED: ship photo AND video in the first feed slice.** Requires backend
  expansion: `trip_photos` → generalize to `trip_posts` (media_type photo|video,
  storage_path, location, caption), + video transcode/thumbnail + blurhash, and
  video-aware moderation (AI pre-flag on a sampled frame + full human review).

### 2.6 Profiles (viewing another member) — **DECIDED: limited + gated**
- Default view (any member): first name, city, **verified badge**, batches
  traveled, and their *approved public posts* only. Never contact info, full
  name, phone, or ID data.
- **Full profile is gated to confirmed co-travelers** of the same batch — only
  people you're actually traveling with see more. Safety-first by design.
- Every profile has a report/block affordance.

### 2.7 Journey (live state machine) — reasoned-out contents
Beyond the states you listed (quiz filled → applied → approved/disapproved →
balance paid), this screen should carry the *whole* trip lifecycle:

| Element | Why it belongs on Journey |
|---|---|
| **Stepper**: Applied → Verify → Deposit → In review → Decision → Balance → Confirmed → Trip → Post-trip | The single source of "where am I?" |
| **Verification gate** (ID/KYC status: pending/submitted/approved) | You can't be screened until verified — surface it as a required step |
| **Live countdowns** | Screening ETA (24–36h) and the **48-hour balance window** — the deadline that releases the slot |
| **Decision card** | Approved → pay balance CTA; **Rejected → reason + deposit-refund status & 5–7 day timeline** |
| **Matched-batch reveal** | Departure date, gender-balance, blurred co-traveler preview that unblurs on confirmation |
| **Payment history / receipts** | Deposit, balance, refunds |
| **Post-confirmation unlocks** | Itinerary, packing list, WhatsApp group CTA, Travelers chat group |
| **Waitlist position** | For Mystery Edition applicants |
| **Trust reassurance** | Keep the "Everyone here was screened — that's why it works" card |
| **Re-apply / apply to another batch** | After a rejection, expiry, or a completed trip |

### 2.8 Verification (who's joining us — the trust engine)
- **Steps:** phone (OTP at auth) → **government ID + selfie liveness** →
  optional Instagram handle → **admin manual review** → **verified badge**.
- Build on the existing `verification_submissions` table (masked docs, admin
  review, public badge only — never expose raw ID data client-side).
- **Make trust visible everywhere:** verified badge on profiles, feed posts, and
  co-traveler lists; per-batch gender-balance bars; a "who's joining" surface
  showing verified-member counts. Verification is a *gate to being screened*,
  and a *feature the whole community can see*.

### 2.9 Chat — **DECIDED: redesign + open-profile, no DMs**
Member-to-member DMs stay OUT of v1 — WhatsApp groups remain the 1:1 channel.
- Batch **community groups tied to journey state**: Interested group on apply,
  Travelers group on deposit (already the behavior) — make the gating explicit.
- Show **verified badges** and tap-to-**open profile** (→ the gated §2.6 profile)
  from chat.
- Apply the redesign visual pass for consistency.

---

## 3. Cross-cutting

- **Design taste:** for each screen, invoke `design-taste-frontend` and
  `impeccable` to push past templated defaults — editorial type, intentional
  minimalism, shared-element transitions (card → detail), blurhash→image fades,
  Rive signature moments (quiz trail, match reveal).
- **Match model:** one shared `matchPercent()` in MatchEngine, unit-tested,
  consumed identically by both platforms.
- **Backend deltas implied:** quiz-result persistence, `matchPercent` inputs,
  `trip_posts` (video+location), profile read model, verification flow wiring.
  All **additive** to the shared prod schema (see `backend/PROD_SCHEMA.md`).

---

## 4. Confirmed decisions (locked 2026-07-22)

1. **Profile visibility** (§2.6): **limited + gated** — limited fields for any
   member, full profile only for confirmed co-travelers.
2. **Chat scope** (§2.9): **redesign + open-profile only**; no 1:1 DMs in v1.
3. **Feed media** (§2.5): **photo + video** in the first feed slice.
4. **Match %** (§2.4): **existing MatchEngine heuristic**, in-app.

---

## 5. Build order (slices — do NOT build all at once)

1. **Auth + phone linkage + live read-hydration** (already designed — the gate
   for every write below).
2. **Quiz redesign** (drop destination Q) → persist compatibility → **Report**.
3. **Discover match %** on destination cards.
4. **Verification flow** (ID/selfie → admin → badge) + Journey verification gate.
5. **Journey state machine** (countdowns, decision/refund, unlocks).
6. **Feed posting + profiles** (photo + video together; gated profiles).
7. **Chat redesign** + trust surfacing.

Each slice = its own spec → plan → implement → verify, and each ships behind the
graceful-fallback contract so the app stays runnable throughout.

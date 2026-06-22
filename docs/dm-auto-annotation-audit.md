# DM Auto-Annotation Audit

**Project:** Togetha.Club Instagram DM agent training  
**Date:** June 2026  
**Scope:** 651 DM pairs imported from Instagram export → LLM-written winning responses → LLM judge scores  
**Human annotators:** Replaced by automated pipeline (optional spot-check only)

---

## 1. Executive summary

You have **651 real Instagram conversations** in `dm_annotations`. Manually annotating each one would take an estimated **40–80 hours** of social media manager time at 4–7 minutes per thread.

This audit documents a **fully automated alternative**:

| Step | Tool | Output |
|------|------|--------|
| Import | `build-classified-dms-from-instagram-export.mjs` | User DM + losing reply + heuristic category |
| Auto-annotate | `auto-annotate-dms.mjs` (Claude Sonnet 4.6) | Winning reply + failure diagnosis |
| Judge | `judge-annotations.mjs` (Claude Sonnet 4.6) | Scores + improvement delta |
| Export | `/api/admin/export-training-data` | Jotform training `.txt` |

**Recommendation:** Run the LLM pipeline, spot-check 20–30 highest-delta examples, then export to Jotform. Keep humans for flagged rows only.

---

## 2. Why automate (the business case)

### Volume
- 651 annotatable pairs from 1,083 Instagram threads
- Human annotation at scale = bottleneck before any agent retraining happens

### Consistency
- One trained persona ("Priya") applies the same rules to every DM
- No drift between annotators, mood, or fatigue

### Speed
- Pipeline can run overnight with `--limit` batches
- Leaderboard and export available next morning

### Cost trade-off
- ~651 API calls to auto-annotate + ~1,302 to judge ≈ **2,000 Claude calls**
- Estimated cost: **$15–40** depending on token length (vs days of SMM salary)

---

## 3. Research foundation

The system prompt is not generic ChatGPT fluff. It encodes findings from conversion research, psychology, and practitioner playbooks.

### 3.1 DM funnel structure (INRO 2026, SetSmart 2026, CreatorFlow 2026)

| Stage | Rule embedded in prompt |
|-------|-------------------------|
| Capture | Answer what they asked first — no pitch in message one |
| Qualify | One question per message; forced choice (A/B) when possible |
| Convert | Single clear next step: quiz link, WhatsApp, or apply |
| Length | Under 280 characters; engagement drops as length rises |

Sources: [INRO DM Funnel Playbook](https://www.inro.social/blog/instagram-dm-funnel-playbook), [SetSmart DM Marketing 2026](https://setsmart.io/blog/instagram-dm-marketing)

### 3.2 Response speed & personalization (Replypop, ReplyRush)

- First useful reply wins when users message multiple brands
- Use their words back; avoid brochure dumps
- Story replies and short "hey" messages are high-intent — treat as leads

Sources: [Replypop — DMs as sales channel](https://replypop.com/blog/instagram-dms-cheapest-sales-channel), [ReplyRush lead gen guide](https://www.replyrush.com/post/instagram-dm-lead-generation)

### 3.3 Solo traveler psychology (AmEx 2025, industry reports)

- Solo travel is mainstream for Millennials/Gen Z — autonomy and self-discovery drive booking
- Fear points: safety, awkward group vibe, "is this a dating app?"
- Content must feel **personal and experience-led**, not package-tourism

Sources: [American Express global travel report via LinkedIn](https://www.linkedin.com/posts/sharmin-de-vries-7757827_the-continued-rise-of-solo-travel-solo-activity-7327959059670659072-tLOb), [PV Story solo travel conversion](https://pvstory.com/blog/solo-travel-content-converts-single-travelers-dominating-instagram)

### 3.4 Indian Gen Z travel funnel (HappyFares 2026)

- Instagram = inspiration layer; **website = conversion layer**
- Transparent next step beats vague "DM us for details"
- Price questions should route to quiz/apply — never invent numbers in chat

Source: [HappyFares — Gen Z Instagram + booking](https://www.happyfares.in/blog/indian-gen-z-instagram-replaces-makemytrip-2026/)

### 3.5 Cialdini persuasion principles (peer-reviewed + field tested)

| Principle | How Priya uses it in DMs |
|-----------|--------------------------|
| **Reciprocity** | Answer the question before asking for anything |
| **Social proof** | "Most people start with the 2-min quiz" (no fake stats) |
| **Scarcity** | Friday slot urgency only — never fabricated "2 spots left" |
| **Liking** | Warm peer tone; mirror user's energy |
| **Commitment** | Small step → quiz → pay (ladder, not leap) |

Sources: [Cialdini — Influence at Work](https://www.influenceatwork.com/7-principles-of-persuasion/), [Scientific American summary](https://digitalwellbeing.org/downloads/CialdiniSciAmerican.pdf)

### 3.6 Travel agency Instagram strategy (Socialmon 2026)

- DMs are the primary conversion channel for high-consideration travel
- Saves and DM volume beat likes as KPIs
- Honest budget/process Q&A drives the most qualified threads

Source: [Socialmon — travel agency Instagram guide](https://www.socialmon.ai/blog/instagram-strategy-for-travel-agencies-a-practical-guide)

---

## 4. The "Priya" persona (system prompt design)

**File:** `scripts/lib/annotation-prompts.mjs` → `AUTO_ANNOTATE_SYSTEM_PROMPT`

| Design choice | Rationale |
|---------------|-----------|
| 10-year SMM veteran | Anchors expert tone without over-explaining |
| Indian metro context | Matches Togetha's audience (22–35, Delhi/Mumbai/Bangalore) |
| Named persona "Priya" | Consistent voice in `annotator_name` field for audit trail |
| Hard Togetha facts block | Prevents hallucinated prices, dates, policies |
| 280-char cap | Matches Instagram DM UX + original annotator UI |
| `is_flagged` escape hatch | Rows needing real inventory/pricing get human review |
| JSON-only output | Machine-parseable for Supabase updates |

### Failure reasons the LLM assigns

| Code | Meaning |
|------|---------|
| `wrong_category` | Agent misread intent (price vs join vs destination) |
| `ignored_question` | Did not address what user asked |
| `too_long` | Brochure-style reply |
| `too_vague` | No concrete next step |
| `made_up_info` | Invented price, date, or policy |
| `wrong_followup` | Asked irrelevant question |
| `generic_reply` | Could apply to any brand |

---

## 5. Pipeline flow

```
Instagram export (.zip)
        ↓
build-classified-dms-from-instagram-export.mjs
        ↓
classified_dms.json (651 rows)
        ↓
seed-annotations.mjs --force
        ↓
dm_annotations table (draft, losing_response filled)
        ↓
auto-annotate-dms.mjs  ← Claude writes winning_response
        ↓
status = reviewed (skips human Annotate/Review tabs)
        ↓
judge-annotations.mjs  ← Claude scores losing vs winning
        ↓
improvement_delta populated
        ↓
Leaderboard tab + export-training-data API
        ↓
Jotform Knowledge Base upload
```

---

## 6. Quality controls

### Built-in safeguards
1. **No invented pricing** — prompt forbids; flagged rows bypass export
2. **280-character limit** — enforced in script (truncates if model overshoots)
3. **Resume support** — skips rows that already have `winning_response`
4. **Report file** — `scripts/output/auto-annotate-report-*.json` logs failures + 5 samples
5. **Judge pass** — separate model call scores both replies on relevance, conversion, tone, accuracy

### What humans should still do
| Task | Frequency |
|------|-----------|
| Spot-check top 20 highest-delta examples | Once per pipeline run |
| Review `is_flagged = true` rows | All flagged (~5–15% expected) |
| Approve export file before Jotform upload | Once |
| Re-run when new Instagram export arrives | Monthly or per batch |

### What humans can skip
- Annotate tab manual entry
- Review tab approve/reject (unless you want a human gate — set `annotation_status` to `submitted` instead of `reviewed` in script)

---

## 7. Current data snapshot (post Instagram import)

| Metric | Value |
|--------|------:|
| Conversations parsed | 1,083 |
| Annotatable pairs | 651 |
| Categories (heuristic) | destination 143, general 344, cold 61, pricing 53, join 44, accommodation 5, payment_fail 1 |
| Losing responses | Imported from export |
| Winning responses | **Pending LLM run** (until `npm run annotations:pipeline`) |

---

## 8. How to run

### Prerequisites
Add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Test on 10 rows first
```bash
cd togetha-club
npm run annotations:auto -- --limit 10
npm run annotations:judge
```

Review samples in `/admin/annotate` → Leaderboard tab.

### Full run (all 651)
```bash
npm run annotations:pipeline
```

Or step by step:
```bash
node scripts/auto-annotate-dms.mjs          # ~45–90 min, 651 calls
node scripts/judge-annotations.mjs          # ~90–180 min, 1302 calls
```

### Export for Jotform
```bash
# While logged in as admin, or:
curl -o togetha_training_data.txt https://togetha.club/api/admin/export-training-data
```

Exports rows where `improvement_delta > 3` and `annotation_status = reviewed`.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| LLM invents batch dates/prices | Prompt + `is_flagged`; export filter |
| Heuristic categories wrong | LLM re-classifies in auto-annotate output |
| API cost on 651 rows | `--limit` batching; run overnight |
| Over-fitted generic replies | Judge delta surfaces weak wins; spot-check top 20 |
| Instagram export pairing errors | Losing reply = next brand message after user turn; manual audit sample |

---

## 10. Files reference

| File | Purpose |
|------|---------|
| `scripts/lib/annotation-prompts.mjs` | Research-backed system prompts |
| `scripts/auto-annotate-dms.mjs` | LLM winning response writer |
| `scripts/judge-annotations.mjs` | LLM scorer (losing vs winning) |
| `scripts/run-llm-annotation-pipeline.mjs` | Runs both in sequence |
| `docs/dm-auto-annotation-audit.md` | This document |
| `classified_dms.json` | 651 imported pairs (gitignored) |

---

## 11. Decision log

| Decision | Choice | Why |
|----------|--------|-----|
| Human vs LLM annotation | **LLM primary** | 651 rows; consistency; cost |
| Persona | Priya, 10yr SMM | Expert anchor + audit trail |
| Skip Review tab | Set `reviewed` directly | User requested no human loop |
| Model | claude-sonnet-4-6 | Same as original judge spec |
| Char limit | 280 | Instagram DM + existing UI |

---

*End of audit. Run `npm run annotations:pipeline` after adding `ANTHROPIC_API_KEY` to execute.*

# Meta Ads ↔ Cursor (MCP + CLI)

Connect Togetha’s Meta ad account to Cursor so the agent can pull reports, audit campaigns, and help with funnel setup (pixels, custom conversions, budgets).

---

## Recommended: Official Meta Ads MCP (already added)

**Endpoint:** `https://mcp.facebook.com/ads`  
**Config file:** `~/.cursor/mcp.json` (global — already includes `meta-ads`)

### Finish setup (one-time, ~2 minutes)

1. **Reload Cursor** — `Cmd+Shift+P` → **Developer: Reload Window**
2. Open **Cursor Settings → MCP** — confirm **meta-ads** appears
3. Click **Needs login** / authenticate when prompted
4. Complete **Meta Business OAuth** with the account that has **Admin** on your ad account
5. Start with **read-only** scope; upgrade to read/write only when you want the agent to change live ads

### Verify connection

Ask in Cursor chat:

```text
List my Meta ad accounts and active campaigns for Togetha.
```

Or:

```text
Call ads_get_ad_accounts and show account IDs and names.
```

If accounts return, MCP is connected.

---

## What you can do from Cursor (with MCP)

| Task | Example prompt |
|------|----------------|
| Audit spend & performance | “Pull last 7 days insights for campaign GenZ_W18-25_Dating_Travel — spend, CTR, CPC, purchases, cost per Lead.” |
| Funnel diagnostic | “Compare ViewContent, Lead, InitiateCheckout, and Purchase counts last 7 days for pixel 1039108298548706.” |
| Campaign health | “List ad sets with spend > ₹500 and zero Lead events in the last 3 days.” |
| Safe edits | “Create a duplicate ad set in PAUSED state with budget ₹800/day — do not publish.” |

**Safety:** Meta’s official MCP creates campaigns/ad sets in **PAUSED** by default. Always review before activating.

---

## Custom conversions (Events Manager)

Pixel events are fired from code (`src/lib/meta-pixel.ts`). Each step sets `?stage=` on the URL so Meta can match **URL rules** in the Events Manager UI.

**Do not use “All URL traffic” + `content_name`** — that only matches PageView-style hits and misses Lead / InitiateCheckout / Purchase.

| Custom conversion | Standard event | URL rule |
|-------------------|----------------|----------|
| TC · Quiz Started | ViewContent | URL contains `stage=quiz-started` |
| TC · Match Result Shown | **Lead** | URL contains `stage=match-result` |
| TC · Payment Initiated | **InitiateCheckout** | URL contains `stage=checkout` |
| TC · Slot Confirmed | **Purchase** | URL contains `confirmation` |

Fire each event on the site once before expecting it in **Test events**.

The MCP can help **audit** whether events are arriving; creating custom conversions may still be done in Events Manager UI unless a specific MCP tool supports it for your account.

---

## CLI option (Marketing API scripts)

MCP covers most day-to-day work. Use CLI/scripts when you want repeatable reports in the repo or CI.

### Prerequisites

1. [Meta for Developers](https://developers.facebook.com/) → create an app (Business type)
2. Add **Marketing API** product
3. Generate a **System User** token in Business Manager with `ads_read` (and `ads_management` if writing)
4. Store secrets in `.env.local` (never commit):

```bash
META_ACCESS_TOKEN=your_long_lived_token
META_AD_ACCOUNT_ID=act_1234567890
META_PIXEL_ID=1039108298548706
```

### Example: insights via curl

```bash
curl -G "https://graph.facebook.com/v25.0/${META_AD_ACCOUNT_ID}/insights" \
  -d "fields=campaign_name,impressions,clicks,spend,actions,cost_per_action_type" \
  -d "date_preset=last_7d" \
  -d "access_token=${META_ACCESS_TOKEN}"
```

### Self-hosted MCP (advanced)

If you need offline/stdin MCP or full API coverage without Meta’s hosted server:

- [armavita-meta-ads-mcp](https://github.com/EfrainTorres/armavita-meta-ads-mcp) — local Python, `META_ACCESS_TOKEN`
- [meta-ads-mcp](https://github.com/MaxterPC/meta-ads-mcp) — self-hosted, multi-tenant

Add to `~/.cursor/mcp.json` as a `command` + `args` server only if you outgrow the official HTTP endpoint.

---

## Togetha funnel ↔ code map

| Step | Meta event | Code location |
|------|------------|---------------|
| Landing | PageView (auto) | `src/components/seo/MetaPixel.tsx` |
| Quiz started | ViewContent | `src/components/quiz/QuizWidget.tsx` |
| Match result | Lead | `src/components/match/MatchLabClient.tsx` |
| Checkout opened | InitiateCheckout | `src/components/apply/RazorpayButton.tsx` |
| Payment success | Purchase | `src/components/apply/RazorpayButton.tsx` |

Env: `NEXT_PUBLIC_META_PIXEL_ID=1039108298548706` (local + Vercel Production, redeploy after adding).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MCP shows “Needs login” | Complete OAuth in Cursor MCP settings |
| No ad accounts returned | Use a Meta login with **Admin** on the ad account in Business Manager |
| Test events empty | Trigger the event on `/match` or production; wait 1–2 minutes |
| Custom conversion Create disabled | Switch event from “All URL traffic” to **Lead** + parameter rule |
| Pixel missing in production | Set `NEXT_PUBLIC_META_PIXEL_ID` on Vercel and **redeploy** |

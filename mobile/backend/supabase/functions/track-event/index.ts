// track-event — records engagement analytics events.
//
// POST { session_id, event_type, ref_type, ref_id, dwell_seconds?, metadata? }
// POST { events: [ ...same shape..., ] }   (batched, max 20)
//   -> { ok: true, inserted: n }
//
// Auth is OPTIONAL: if a valid JWT is present, events are attributed to the
// user; otherwise they stay anonymous (grouped by session_id).
// Values are validated against the checks defined in
// prod_migrations/0001_mobile_additions.sql (engagement_events).

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthedUser, serviceClient } from "../_shared/auth.ts";

const EVENT_TYPES = new Set([
  "ad_click",
  "ad_impression",
  "listing_view",
  "listing_click",
  "screen_view",
  "quiz_start",
  "apply_start",
]);
const REF_TYPES = new Set(["ad", "batch", "screen", "quiz"]);
const MAX_BATCH = 20;

interface EventInput {
  session_id?: unknown;
  event_type?: unknown;
  ref_type?: unknown;
  ref_id?: unknown;
  dwell_seconds?: unknown;
  metadata?: unknown;
}

function validate(e: EventInput): string | null {
  if (typeof e.session_id !== "string" || e.session_id.length === 0) {
    return "session_id is required";
  }
  if (typeof e.event_type !== "string" || !EVENT_TYPES.has(e.event_type)) {
    return `event_type must be one of: ${[...EVENT_TYPES].join(", ")}`;
  }
  if (typeof e.ref_type !== "string" || !REF_TYPES.has(e.ref_type)) {
    return `ref_type must be one of: ${[...REF_TYPES].join(", ")}`;
  }
  if (typeof e.ref_id !== "string" || e.ref_id.length === 0) {
    return "ref_id is required";
  }
  if (
    e.dwell_seconds !== undefined && e.dwell_seconds !== null &&
    (typeof e.dwell_seconds !== "number" || e.dwell_seconds < 0 ||
      !Number.isFinite(e.dwell_seconds))
  ) {
    return "dwell_seconds must be a non-negative number";
  }
  if (
    e.metadata !== undefined && e.metadata !== null &&
    (typeof e.metadata !== "object" || Array.isArray(e.metadata))
  ) {
    return "metadata must be an object";
  }
  return null;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const events: EventInput[] = Array.isArray(body.events)
    ? body.events as EventInput[]
    : [body as EventInput];

  if (events.length === 0) {
    return jsonResponse({ error: "No events provided" }, 400);
  }
  if (events.length > MAX_BATCH) {
    return jsonResponse({ error: `At most ${MAX_BATCH} events per request` }, 400);
  }

  for (const e of events) {
    const problem = validate(e);
    if (problem) return jsonResponse({ error: problem }, 400);
  }

  // Optional auth — attach user_id when a valid JWT is present.
  const user = await getAuthedUser(req);

  const rows = events.map((e) => ({
    user_id: user?.id ?? null,
    session_id: e.session_id as string,
    event_type: e.event_type as string,
    ref_type: e.ref_type as string,
    ref_id: e.ref_id as string,
    dwell_seconds: (e.dwell_seconds as number | undefined) ?? null,
    metadata: (e.metadata as Record<string, unknown> | undefined) ?? {},
  }));

  const db = serviceClient();
  const { error } = await db.from("engagement_events").insert(rows);
  if (error) {
    console.error("engagement_events insert failed:", error);
    return jsonResponse({ error: "Could not record events" }, 500);
  }

  return jsonResponse({ ok: true, inserted: rows.length });
});

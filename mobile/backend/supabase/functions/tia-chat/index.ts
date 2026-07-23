// tia-chat — Claude proxy for Tia, the Togetha club concierge.
// POST { messages: [{ role: 'user'|'assistant', content: string }, ...] } -> { reply }
//
// Tia has READ-ONLY database tools, executed server-side with the service
// client and ALWAYS scoped to the authenticated user's id. The model never
// supplies a user_id and can never write.

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthedUser, serviceClient } from "../_shared/auth.ts";

const MODEL = "claude-sonnet-5";
const MAX_TOOL_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are Tia, the friendly concierge for Togetha.Club — India's first matchmaking travel club. Singles apply, get screened by a human team, get matched, and travel together on curated batches.

How the club actually works (always be honest about this):
- The flow is: quiz → apply → deposit (30% of the trip price) → human screening/verification (24–36 hours) → profile approval → balance payment → matched onto a travel batch.
- The deposit reserves a SCREENING SLOT ONLY. It is never a guaranteed seat and never an instant confirmation. A human reviews every applicant before anything is confirmed.
- After profile approval, members have a 48-hour window to pay the remaining balance. If the window is missed, the slot is released.
- Batches run alternating Friday departures. GenZ editions are for ages 18–25, Millennial editions for 26–36. Each departure has limited per-gender spots.
- Togetha is women-majority by design, trust-first, and verification-focused. Safety and curation come before speed.

You have read-only tools to look up the member's own bookings, the public batch schedule, their feedback tickets, and their chat groups. Use them instead of guessing. Booking amounts (amount_paid, balance_due) are in paise (divide by 100 for rupees); a batch's price field is already in rupees.

Hard rules:
- NEVER promise or imply approval, acceptance odds, guaranteed seats, or instant confirmation. Do not speculate on whether someone will pass screening.
- If you are unsure about something, or the question involves a payment dispute, refund, or anything sensitive, warmly direct the member to human support on WhatsApp instead of guessing.
- Be warm, concise, and honest. You represent a club that values trust above all.`;

const FALLBACK_REPLY =
  "I'm having a little trouble connecting right now. Please try again in a moment — or reach our human team on WhatsApp and they'll take care of you.";

const TOOLS = [
  {
    name: "get_my_bookings",
    description:
      "Get the member's own applications/bookings: batch name, application status, KYC status, payment amounts, balance due (paise), balance deadline, and payment plan.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_batch_schedule",
    description:
      "List open batches with prices (INR rupees), per-gender capacity, and their upcoming open departures (public information).",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_my_feedback",
    description:
      "Get the member's own feedback/query/complaint tickets and their status.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_my_chat_groups",
    description: "List the community chat groups the member belongs to.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
];

// deno-lint-ignore no-explicit-any
type Db = ReturnType<typeof serviceClient>;

async function runTool(db: Db, userId: string, name: string): Promise<unknown> {
  switch (name) {
    case "get_my_bookings": {
      // Prod schema: the member's funnel record is applicants, linked via
      // profiles.applicant_id. Amounts (amount_paid, balance_due) are paise;
      // batches.price is rupees.
      const { data: profile, error: profErr } = await db
        .from("profiles")
        .select("applicant_id")
        .eq("id", userId)
        .single();
      if (profErr) return { error: profErr.message };
      if (!profile?.applicant_id) return { bookings: [] };
      const { data, error } = await db
        .from("applicants")
        .select(
          "id, status, kyc_status, payment_plan, amount_paid, balance_due, balance_deadline_at, created_at, batches ( slug, name, price ), batch_departures ( label, sublabel, departure_date, return_date )",
        )
        .eq("id", profile.applicant_id);
      if (error) return { error: error.message };
      return { bookings: data ?? [] };
    }
    case "get_batch_schedule": {
      const { data: batches, error } = await db
        .from("batches")
        .select(
          "slug, name, status, price, deposit_percent, max_spots_m, max_spots_f, spots_taken_m, spots_taken_f",
        )
        .in("status", ["open", "waitlist", "coming_soon"]);
      if (error) return { error: error.message };
      const slugs = (batches ?? []).map((b: { slug: string }) => b.slug);
      const { data: departures } = slugs.length
        ? await db
          .from("batch_departures")
          .select(
            "batch_slug, label, sublabel, departure_date, return_date, status, spots_m, spots_f, spots_taken_m, spots_taken_f",
          )
          .in("batch_slug", slugs)
          .eq("status", "open")
          .order("departure_date", { ascending: true })
        : { data: [] };
      return { batches: batches ?? [], open_departures: departures ?? [] };
    }
    case "get_my_feedback": {
      const { data, error } = await db
        .from("feedback")
        .select("id, kind, subject, body, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) return { error: error.message };
      return { feedback: data ?? [] };
    }
    case "get_my_chat_groups": {
      const { data, error } = await db
        .from("chat_members")
        .select("added_at, chat_groups ( name, kind, is_active )")
        .eq("user_id", userId);
      if (error) return { error: error.message };
      return { groups: data ?? [] };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: unknown;
  [key: string]: unknown;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const user = await getAuthedUser(req);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  let inputMessages: Array<{ role: string; content: string }>;
  try {
    const body = await req.json();
    inputMessages = body.messages;
    if (!Array.isArray(inputMessages) || inputMessages.length === 0) {
      throw new Error();
    }
  } catch {
    return jsonResponse({ error: "messages array is required" }, 400);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return jsonResponse({ reply: FALLBACK_REPLY });

  const db = serviceClient();

  // Conversation for the API — content may be string or block array.
  const messages: Array<{ role: string; content: unknown }> = inputMessages.map(
    (m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content),
    }),
  );

  try {
    for (let i = 0; i <= MAX_TOOL_ITERATIONS; i++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages,
        }),
      });

      if (!res.ok) {
        console.error("Anthropic API error:", res.status, await res.text());
        return jsonResponse({ reply: FALLBACK_REPLY });
      }

      const data = await res.json();
      const content = (data.content ?? []) as ContentBlock[];

      if (data.stop_reason !== "tool_use" || i === MAX_TOOL_ITERATIONS) {
        const reply = content
          .filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join("") || FALLBACK_REPLY;
        return jsonResponse({ reply });
      }

      // Execute each requested tool, scoped to the authenticated user.
      messages.push({ role: "assistant", content });
      const toolResults = [];
      for (const block of content) {
        if (block.type !== "tool_use" || !block.id || !block.name) continue;
        const result = await runTool(db, user.id, block.name);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      messages.push({ role: "user", content: toolResults });
    }

    return jsonResponse({ reply: FALLBACK_REPLY });
  } catch (err) {
    console.error("tia-chat error:", err);
    return jsonResponse({ reply: FALLBACK_REPLY });
  }
});

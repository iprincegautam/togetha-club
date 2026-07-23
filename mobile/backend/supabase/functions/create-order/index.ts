// create-order — creates Razorpay orders and verifies payments.
// SHARED-PROD version: targets the website's real schema (applicants,
// batches keyed by slug, applicant_payments ledger). See backend/PROD_SCHEMA.md.
//
// POST { applicant_id, payment_plan: 'deposit' | 'full' | 'balance' }
//   -> { order_id, amount, currency: 'INR', key_id }        (amount in paise)
// POST { action: 'verify', razorpay_order_id, razorpay_payment_id, razorpay_signature }
//   -> { verified: true, applicant_status }
//
// Website payment semantics:
//   batches.price is INTEGER RUPEES -> total paise = price * 100 (unless the
//   applicant already has final_amount set — promo pricing — which wins).
//   deposit  = batches.deposit_percent (default 30) of total -> status 'deposit_paid'
//              (reserves a SCREENING SLOT only — never a guaranteed seat)
//   full     = 100% -> status 'paid'
//   balance  = applicants.balance_due (paise) -> balance_due 0, status 'paid'
// Every charge gets an applicant_payments ledger row (captured_at set on
// verify — also our idempotency marker). First successful payment increments
// batches.spots_taken_m/f per applicants.gender.

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthedUser, serviceClient } from "../_shared/auth.ts";

const DEPOSIT_PERCENT_DEFAULT = 30;

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// deno-lint-ignore no-explicit-any
type Db = any;

/** The caller's applicant row, or null unless it's theirs (profiles.applicant_id). */
async function getOwnedApplicant(db: Db, userId: string, applicantId: string) {
  const { data: profile } = await db
    .from("profiles")
    .select("applicant_id")
    .eq("id", userId)
    .single();
  if (!profile?.applicant_id || profile.applicant_id !== applicantId) {
    return null;
  }
  const { data: applicant } = await db
    .from("applicants")
    .select(
      "id, status, gender, batch_slug, payment_plan, amount_paid, balance_due, final_amount",
    )
    .eq("id", applicantId)
    .single();
  return applicant ?? null;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const user = await getAuthedUser(req);
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const db = serviceClient();
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  // ---- verify flow -------------------------------------------------------
  if (body.action === "verify") {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      body as Record<string, string>;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonResponse({ error: "Missing verification fields" }, 400);
    }
    if (!keySecret) {
      return jsonResponse({ error: "Payments not configured" }, 500);
    }

    const expected = await hmacSha256Hex(
      keySecret,
      `${razorpay_order_id}|${razorpay_payment_id}`,
    );
    if (expected !== razorpay_signature) {
      return jsonResponse({ error: "Invalid payment signature" }, 400);
    }

    const { data: ledger, error: ledErr } = await db
      .from("applicant_payments")
      .select("id, applicant_id, payment_kind, amount_paise, captured_at")
      .eq("razorpay_order_id", razorpay_order_id)
      .single();
    if (ledErr || !ledger) {
      return jsonResponse({ error: "Payment not found" }, 404);
    }

    const applicant = await getOwnedApplicant(db, user.id, ledger.applicant_id);
    if (!applicant) return jsonResponse({ error: "Forbidden" }, 403);

    // Idempotency: already captured -> return current state.
    if (ledger.captured_at) {
      return jsonResponse({ verified: true, applicant_status: applicant.status });
    }

    const chargePaise: number = ledger.amount_paise ?? 0;

    await db
      .from("applicant_payments")
      .update({ razorpay_payment_id, captured_at: new Date().toISOString() })
      .eq("id", ledger.id);

    // Advance the applicant per website semantics.
    const isFirstPayment = (applicant.amount_paid ?? 0) === 0;
    const paidNow = (applicant.amount_paid ?? 0) + chargePaise;
    let nextStatus: string;
    const update: Record<string, unknown> = {
      amount_paid: paidNow,
      razorpay_order_id,
      razorpay_payment_id,
      updated_at: new Date().toISOString(),
    };
    if (ledger.payment_kind === "deposit") {
      nextStatus = "deposit_paid";
      const total = applicant.final_amount ?? paidNow;
      update.balance_due = Math.max(0, total - paidNow);
    } else {
      // 'full' or 'balance' clears everything due.
      nextStatus = "paid";
      update.balance_due = 0;
    }
    update.status = nextStatus;
    await db.from("applicants").update(update).eq("id", applicant.id);

    // First successful payment claims a per-gender spot on the batch.
    if (isFirstPayment && applicant.batch_slug) {
      const gender = applicant.gender;
      if (gender === "m" || gender === "f") {
        const col = gender === "m" ? "spots_taken_m" : "spots_taken_f";
        const { data: batch } = await db
          .from("batches")
          .select(`slug, ${col}`)
          .eq("slug", applicant.batch_slug)
          .single();
        if (batch) {
          const current = (batch as Record<string, number>)[col] ?? 0;
          await db
            .from("batches")
            .update({ [col]: current + 1 })
            .eq("slug", applicant.batch_slug);
        }
      }
    }

    return jsonResponse({ verified: true, applicant_status: nextStatus });
  }

  // ---- create-order flow -------------------------------------------------
  // Accept applicant_id (canonical) or application_id (legacy client field).
  const applicantId = (body.applicant_id ?? body.application_id) as
    | string
    | undefined;
  const plan = (body.payment_plan ?? body.kind) as string | undefined;
  if (
    !applicantId ||
    (plan !== "deposit" && plan !== "full" && plan !== "balance")
  ) {
    return jsonResponse(
      {
        error:
          "applicant_id and payment_plan ('deposit'|'full'|'balance') are required",
      },
      400,
    );
  }

  const applicant = await getOwnedApplicant(db, user.id, applicantId);
  if (!applicant) return jsonResponse({ error: "Applicant not found" }, 404);

  const { data: batch } = applicant.batch_slug
    ? await db
      .from("batches")
      .select("slug, price, deposit_percent, status")
      .eq("slug", applicant.batch_slug)
      .single()
    : { data: null };

  let chargePaise: number;
  if (plan === "balance") {
    chargePaise = applicant.balance_due ?? 0;
    if (chargePaise < 100) {
      return jsonResponse({ error: "No balance due on this application" }, 400);
    }
  } else {
    // Promo-adjusted final_amount (paise) wins; otherwise price rupees * 100.
    const totalPaise = applicant.final_amount ??
      (batch?.price != null ? batch.price * 100 : null);
    if (totalPaise == null) {
      return jsonResponse(
        { error: "This batch is waitlist-only and cannot be booked yet" },
        400,
      );
    }
    if (plan === "full") {
      chargePaise = totalPaise;
    } else {
      const pct = batch?.deposit_percent ?? DEPOSIT_PERCENT_DEFAULT;
      chargePaise = Math.round((totalPaise * pct) / 100);
      // Clamp: at least ₹1, and leave at least ₹1 of balance.
      chargePaise = Math.max(100, Math.min(chargePaise, totalPaise - 100));
    }
  }

  let orderId: string;

  if (!keyId || !keySecret) {
    if (Deno.env.get("DENO_ENV") === "development") {
      orderId = "dev_order_" + crypto.randomUUID();
    } else {
      return jsonResponse({ error: "Payments not configured" }, 500);
    }
  } else {
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: chargePaise, // paise
        currency: "INR",
        receipt: `app_${applicantId}_${plan}`,
        notes: { applicant_id: applicantId, payment_plan: plan },
      }),
    });
    if (!rzpRes.ok) {
      const detail = await rzpRes.text();
      console.error("Razorpay order creation failed:", detail);
      return jsonResponse({ error: "Could not create payment order" }, 502);
    }
    const order = await rzpRes.json();
    orderId = order.id;
  }

  // Ledger row (captured_at stays null until verified).
  const { error: insErr } = await db.from("applicant_payments").insert({
    applicant_id: applicantId,
    payment_kind: plan,
    amount_paise: chargePaise,
    currency: "INR",
    razorpay_order_id: orderId,
  });
  if (insErr) {
    console.error("applicant_payments insert failed:", insErr);
    return jsonResponse({ error: "Could not record payment" }, 500);
  }

  // Record the chosen plan + expected balance on the applicant.
  if (plan !== "balance") {
    const totalPaise = applicant.final_amount ??
      (batch?.price != null ? batch.price * 100 : 0);
    await db
      .from("applicants")
      .update({
        payment_plan: plan,
        balance_due: plan === "full" ? 0 : Math.max(0, totalPaise - chargePaise),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicantId);
  }

  return jsonResponse({
    order_id: orderId,
    amount: chargePaise,
    currency: "INR",
    key_id: keyId ?? "dev_key",
  });
});

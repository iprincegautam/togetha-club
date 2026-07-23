// create-application — creates (or returns) the signed-in user's applicant row.
// SHARED-PROD version: writes the website's real `applicants` table with the
// service role, then links profiles.applicant_id — the same email-keyed model
// the website uses (src/lib/auth/signup.ts), so web and app never diverge.
//
// Idempotent: if the user already has a linked applicant (or one exists for
// their email), it is returned instead of creating a duplicate. Creates a
// PENDING applicant only — no money moves here (payment is create-order + Razorpay).
//
// POST { batch_slug, departure_id?, name?, gender?, city?, intent?,
//        payment_plan?, quiz_answers?, quiz_score? }   (auth: user JWT)
//   -> { applicant }

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthedUser, serviceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const user = await getAuthedUser(req);
    if (!user) return jsonResponse({ error: "unauthorized" }, 401);
    const body = await req.json().catch(() => ({}));

    const db = serviceClient();
    const email = (user.email ?? "").trim().toLowerCase();

    // Ensure a profile row and read its current link.
    await db.from("profiles").upsert({ id: user.id, email, role: "member" }, { onConflict: "id", ignoreDuplicates: true });
    const { data: profile } = await db.from("profiles").select("applicant_id").eq("id", user.id).maybeSingle();

    // Idempotency: already linked, or an applicant already exists for this email.
    let applicantId: string | null = profile?.applicant_id ?? null;
    if (!applicantId && email) {
      const { data: existing } = await db
        .from("applicants").select("id").ilike("email", email)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      applicantId = existing?.id ?? null;
    }

    if (!applicantId) {
      // Create a PENDING applicant. Gender maps 'Woman'/'Man' -> 'f'/'m'.
      const g = String(body.gender ?? "").toLowerCase();
      const gender = g.startsWith("w") ? "f" : g.startsWith("m") ? "m" : null;
      const { data: created, error } = await db.from("applicants").insert({
        email,
        name: body.name ?? null,
        gender,
        batch_slug: body.batch_slug ?? null,
        departure_id: body.departure_id ?? null,
        status: "pending",
        kyc_status: "pending",
        payment_plan: body.payment_plan ?? "deposit",
        quiz_answers: body.quiz_answers ?? null,
        quiz_score: body.quiz_score ?? null,
        lead_source: "mobile_app",
      }).select("id").single();
      if (error) return jsonResponse({ error: error.message }, 400);
      applicantId = created.id as string;
    }

    // Link the profile.
    await db.from("profiles").update({ applicant_id: applicantId }).eq("id", user.id);

    const { data: applicant } = await db
      .from("applicants")
      .select("id, name, batch_slug, departure_id, status, kyc_status, payment_plan, amount_paid, balance_deadline_at, created_at, quiz_score")
      .eq("id", applicantId)
      .maybeSingle();

    return jsonResponse({ applicant });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});

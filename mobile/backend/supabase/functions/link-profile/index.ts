// link-profile — first-call bootstrap for a freshly phone-authed user.
// SHARED-PROD version: works against the website's real profiles/applicants.
//
// Idempotent. On every authenticated call it:
//   1. ensures a `profiles` row exists for auth.uid() (role 'member'),
//   2. if that profile isn't linked yet, matches an existing `applicants` row by
//      normalized phone (E.164) and links it (only on a single unambiguous match),
//   3. returns a bootstrap snapshot the app hydrates from.
//
// This is the safe way to reconcile a mobile signup with the ~1,890 applicants
// the website already created — no duplicate applicant rows are ever made here.
//
// POST {}  (auth: user JWT) -> { user_id, applicant_id | null, profile, application | null }

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthedUser, serviceClient } from "../_shared/auth.ts";

/** Normalize an Indian phone to E.164 ("+91XXXXXXXXXX"). */
function e164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return "+" + digits;
  if (raw.startsWith("+")) return raw;
  return "+" + digits;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const user = await getAuthedUser(req);
    if (!user) return jsonResponse({ error: "unauthorized" }, 401);

    const db = serviceClient();

    // 1) Ensure a profile row (additive; never clobber existing website fields).
    await db.from("profiles").upsert(
      { id: user.id, role: "member" },
      { onConflict: "id", ignoreDuplicates: true },
    );

    const { data: profile } = await db
      .from("profiles")
      .select("applicant_id, full_name, display_name, email, phone")
      .eq("id", user.id)
      .maybeSingle();

    let applicantId: string | null = profile?.applicant_id ?? null;

    // 2) Link if not already linked. Match the WEBSITE's method exactly (see
    //    src/lib/auth/signup.ts completeMemberSignup): by EMAIL first
    //    (applicants.email, case-insensitive, most recent), then phone as a
    //    fallback. This keeps web and app resolving the same person to the same
    //    applicant row — the fix for "logged in on the app but sees no booking".
    if (!applicantId) {
      const email = (user.email ?? profile?.email ?? "").trim().toLowerCase();
      if (email) {
        const { data: byEmail } = await db
          .from("applicants")
          .select("id")
          .ilike("email", email)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byEmail?.id) applicantId = byEmail.id as string;
      }

      // Phone fallback — only a single, unambiguous match (avoids mislinking).
      if (!applicantId) {
        const phone = e164(user.phone ?? profile?.phone);
        if (phone) {
          const { data: matches } = await db
            .from("applicants")
            .select("id")
            .eq("phone", phone)
            .limit(2);
          if (matches && matches.length === 1) applicantId = matches[0].id as string;
        }
      }

      if (applicantId) {
        await db.from("profiles").update({ applicant_id: applicantId }).eq("id", user.id);
      }
    }

    // 3) Bootstrap snapshot of the linked application, if any.
    let application = null;
    if (applicantId) {
      const { data } = await db
        .from("applicants")
        .select("id, name, batch_slug, departure_id, status, kyc_status, payment_plan, amount_paid, balance_due, balance_deadline_at")
        .eq("id", applicantId)
        .maybeSingle();
      application = data ?? null;
    }

    return jsonResponse({
      user_id: user.id,
      applicant_id: applicantId,
      profile: profile ?? null,
      application,
    });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});

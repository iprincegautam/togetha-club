// get-logistics — returns a confirmed traveler's trip logistics.
// SHARED-PROD version: reads the website's real `departure_logistics` row
// (pickup / vehicle / guide / times) plus mobile-only stay photos.
//
// GATE (server-enforced, mirrors the website's /api/account/logistics rule):
//   the applicant linked to the authed user MUST be status='approved' or 'paid'
//   AND have amount_paid > 0 AND a resolvable departure_id. The guide's phone
//   number is a privacy gate — never returned before approval.
//
// POST {}  (auth: user JWT)
//   -> 200 { unlocked: true, logistics: {...} }
//   -> 200 { unlocked: false }        when the gate isn't met (not an error)

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthedUser, serviceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    // 1) Identify the caller and resolve their applicant record.
    const user = await getAuthedUser(req);
    if (!user) return jsonResponse({ error: "unauthorized" }, 401);

    const db = serviceClient();

    const { data: profile } = await db
      .from("profiles")
      .select("applicant_id")
      .eq("id", user.id)
      .maybeSingle();

    const applicantId = profile?.applicant_id;
    if (!applicantId) return jsonResponse({ unlocked: false });

    const { data: applicant } = await db
      .from("applicants")
      .select("status, amount_paid, departure_id")
      .eq("id", applicantId)
      .maybeSingle();

    // 2) Enforce the gate: approved OR paid, a real payment, a known departure.
    const gateOpen =
      !!applicant &&
      (applicant.status === "approved" || applicant.status === "paid") &&
      (applicant.amount_paid ?? 0) > 0 &&
      !!applicant.departure_id;

    if (!gateOpen) return jsonResponse({ unlocked: false });

    // 3) Read the departure's logistics row (service role bypasses default-deny RLS).
    const { data: logi } = await db
      .from("departure_logistics")
      .select(
        "pickup_location, reporting_time, departure_time, arrival_time, vehicle_number, guide_name, guide_phone, guide_email",
      )
      .eq("departure_id", applicant.departure_id)
      .maybeSingle();

    // Stay photos are a mobile-only addition (departure_stays: mobile prod
    // migration). Absent until that table ships — return an empty list.
    const { data: stays } = await db
      .from("departure_stays")
      .select("id, name, location, nights, note, photo_url")
      .eq("departure_id", applicant.departure_id)
      .order("sort_order", { ascending: true });

    return jsonResponse({
      unlocked: true,
      logistics: {
        pickup_location: logi?.pickup_location ?? "",
        reporting_time: logi?.reporting_time ?? "",
        departure_time: logi?.departure_time ?? "",
        arrival_time: logi?.arrival_time ?? "",
        vehicle_number: logi?.vehicle_number ?? "",
        guide_name: logi?.guide_name ?? "",
        guide_phone: logi?.guide_phone ?? "",
        guide_email: logi?.guide_email ?? "",
        stays: stays ?? [],
      },
    });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});

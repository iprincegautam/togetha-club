package club.togetha.app.core.api

import android.util.Log
import club.togetha.app.BuildConfig
import club.togetha.app.core.model.AnalyticsEvent
import club.togetha.app.core.model.Application
import club.togetha.app.core.model.ApplicationStatus
import club.togetha.app.core.model.Batch
import club.togetha.app.core.model.ChatGroup
import club.togetha.app.core.model.ChatMessage
import club.togetha.app.core.model.Departure
import club.togetha.app.core.model.GroupMessage
import club.togetha.app.core.model.ItineraryDay
import club.togetha.app.core.model.KycForm
import club.togetha.app.core.model.KycStatus
import club.togetha.app.core.model.OrderResult
import club.togetha.app.core.model.PaymentPlan
import club.togetha.app.core.model.PaymentRecord
import club.togetha.app.core.model.Profile
import club.togetha.app.core.model.SupportQuery
import club.togetha.app.core.model.TripPhoto
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlinx.serialization.json.add

interface ApiClient {
    suspend fun fetchBatches(): List<Batch>
    suspend fun fetchApplication(): Application?
    suspend fun submitQuiz(answers: Map<String, String>): Boolean
    suspend fun submitApplication(batchId: String, departureId: String, plan: PaymentPlan, form: Map<String, String>): Application
    suspend fun createOrder(applicationId: String, kind: String): OrderResult
    suspend fun fetchFeed(): List<TripPhoto>
    suspend fun sendTiaMessage(history: List<ChatMessage>, text: String): ChatMessage
    suspend fun fetchProfile(): Profile
    suspend fun fetchPayments(): List<PaymentRecord>
    suspend fun fetchChatGroups(): List<ChatGroup>
    suspend fun fetchGroupMessages(groupId: String): List<GroupMessage>
    suspend fun sendGroupMessage(groupId: String, text: String): GroupMessage
    suspend fun fetchQueries(): List<SupportQuery>
    suspend fun submitQuery(subject: String, body: String): SupportQuery
    suspend fun submitKyc(form: KycForm): KycStatus
    suspend fun joinWaitlist(batchId: String, email: String): Boolean
    suspend fun trackEvents(events: List<AnalyticsEvent>)
}

/** Rich in-memory mock backing the whole app. All product surfaces run on this. */
class MockApiClient : ApiClient {

    private var application: Application? = null
    private var kycStatus: KycStatus = KycStatus.PENDING

    private fun himalayanItinerary() = listOf(
        ItineraryDay(1, "Delhi → Manali", "Overnight Volvo with your batch — the introductions start on the bus."),
        ItineraryDay(2, "Manali", "Old Manali cafés, orientation walk, first bonfire with the full group."),
        ItineraryDay(3, "Kasol", "Parvati valley day — riverside lunch, small-pod hikes, live music night."),
        ItineraryDay(4, "Kasol → Sissu", "Atal tunnel crossing into Lahaul. Snow-line photo stops."),
        ItineraryDay(5, "Sissu", "Waterfall walk, slow afternoon, the 2am bonfire this quiz keeps asking about."),
        ItineraryDay(6, "Return", "Back over the pass and homeward — the group chat does not go quiet."),
    )

    private fun udaipurItinerary() = listOf(
        ItineraryDay(1, "Arrive in Udaipur", "Heritage stay check-in, old-city walk, rooftop dinner over Lake Pichola."),
        ItineraryDay(2, "Kumbhalgarh", "Fort day trip, picnic on the ramparts, sunset boat back in Udaipur."),
        ItineraryDay(3, "Slow morning", "Ghat-side breakfast and goodbyes that take too long."),
    )

    private fun fridays(ids: String, dates: List<String>) = dates.mapIndexed { i, d ->
        Departure("$ids-d${i + 1}", d, womenLeft = listOf(5, 8, 11, 12)[i % 4], menLeft = listOf(3, 7, 10, 12)[i % 4])
    }

    private val batches = listOf(
        Batch(
            id = "batch-a", slug = "himalayan-genz", name = "Himalayan Love Trail — GenZ Edition",
            tagline = "Manali · Kasol · Sissu, with people worth meeting.",
            route = "Manali · Kasol · Sissu", duration = "5N/6D", ageMin = 18, ageMax = 25,
            priceInr = 9999, depositInr = 3000,
            womenCount = 7, menCount = 9, coverColor = 0xFF2E4A42,
            departures = fridays("a", listOf("Fri, 7 Aug 2026", "Fri, 21 Aug 2026", "Fri, 4 Sep 2026", "Fri, 18 Sep 2026")),
            itinerary = himalayanItinerary(),
            highlights = listOf("12 women / 12 men per departure", "AI-matched batch chemistry", "Bonfire nights in Kasol & Sissu", "Every traveler human-screened"),
        ),
        Batch(
            id = "batch-b", slug = "himalayan-millennial", name = "Himalayan Love Trail — Millennial Edition",
            tagline = "Same mountains, deeper conversations.",
            route = "Manali · Kasol · Sissu", duration = "5N/6D", ageMin = 26, ageMax = 36,
            priceInr = 9999, depositInr = 3000,
            womenCount = 9, menCount = 6, coverColor = 0xFF23555E,
            departures = fridays("b", listOf("Fri, 14 Aug 2026", "Fri, 28 Aug 2026", "Fri, 11 Sep 2026", "Fri, 25 Sep 2026")),
            itinerary = himalayanItinerary(),
            highlights = listOf("12 women / 12 men per departure", "AI-matched batch chemistry", "Alternating Friday departures", "Every traveler human-screened"),
        ),
        Batch(
            id = "batch-d", slug = "udaipur-genz", name = "Udaipur Love Trail — GenZ Edition",
            tagline = "Lakes, forts, and long rooftop dinners.",
            route = "Udaipur · Kumbhalgarh", duration = "2N/3D", ageMin = 18, ageMax = 25,
            priceInr = 13999, depositInr = 4200,
            womenCount = 6, menCount = 8, coverColor = 0xFF7A4A3A,
            departures = fridays("d", listOf("Fri, 7 Aug 2026", "Fri, 21 Aug 2026", "Fri, 4 Sep 2026", "Fri, 18 Sep 2026")),
            itinerary = udaipurItinerary(),
            highlights = listOf("12 women / 12 men per departure", "Heritage stay on Lake Pichola", "Kumbhalgarh fort picnic", "Every traveler human-screened"),
        ),
        Batch(
            id = "batch-e", slug = "udaipur-millennial", name = "Udaipur Love Trail — Millennial Edition",
            tagline = "Palace city, unhurried company.",
            route = "Udaipur · Kumbhalgarh", duration = "2N/3D", ageMin = 26, ageMax = 36,
            priceInr = 13999, depositInr = 4200,
            womenCount = 10, menCount = 7, coverColor = 0xFF6A4A5A,
            departures = fridays("e", listOf("Fri, 14 Aug 2026", "Fri, 28 Aug 2026", "Fri, 11 Sep 2026", "Fri, 25 Sep 2026")),
            itinerary = udaipurItinerary(),
            highlights = listOf("12 women / 12 men per departure", "Sunset boat on Lake Pichola", "Rooftop dinner with live folk music", "Every traveler human-screened"),
        ),
        Batch(
            id = "batch-c", slug = "mystery-edition", name = "Mystery Edition",
            tagline = "You'll know where when you're on the bus.",
            route = "Undisclosed", duration = "?N/?D", ageMin = 18, ageMax = 36,
            priceInr = 0, depositInr = 0, waitlistOnly = true,
            womenCount = 0, menCount = 0, coverColor = 0xFF2C2430,
        ),
    )

    private val feed = listOf(
        TripPhoto("p1", "batch-a", "Himalayan Love Trail", "", "Kasol riverside, day three", true, tint = 0xFF35564C),
        TripPhoto("p2", "batch-a", "Himalayan Love Trail", "", "Bonfire, night two", true, tint = 0xFF4A3A2E),
        TripPhoto("p3", "batch-b", "Himalayan Love Trail", "", "Sissu snow line", true, tint = 0xFF2E4A5A),
        TripPhoto("p4", "batch-d", "Udaipur Love Trail", "", "Pichola at golden hour", true, tint = 0xFF8A5A3A),
        TripPhoto("p5", "batch-e", "Udaipur Love Trail", "", "Rooftop dinner", true, tint = 0xFF6A4A5A),
        TripPhoto("p6", "batch-d", "Udaipur Love Trail", "", "Kumbhalgarh ramparts", true, tint = 0xFF9A6A4A),
    )
    private val myUploads = mutableListOf<TripPhoto>()

    // --- Community chat --------------------------------------------------------

    private fun interestedGroup(b: Batch, members: Int, last: String) =
        ChatGroup("g-${b.id}-int", b.id, "${b.name} · Interested", "interested", members, last, b.coverColor)

    private fun travelersGroup(b: Batch, members: Int, last: String) =
        ChatGroup("g-${b.id}-trav", b.id, "${b.name} · Travelers", "travelers", members, last, b.coverColor)

    /** User starts in the Udaipur GenZ Interested group. */
    private val myGroups = mutableListOf(
        interestedGroup(batches.first { it.id == "batch-d" }, 41, "Ria: anyone doing the 21 Aug departure?"),
    )

    private val groupMessages = mutableMapOf<String, MutableList<GroupMessage>>(
        "g-batch-d-int" to mutableListOf(
            GroupMessage("m1", "g-batch-d-int", "Ria", "anyone doing the 21 Aug departure?", "Monday", "6:41 PM"),
            GroupMessage("m2", "g-batch-d-int", "Kabir", "thinking about it — is the fort day optional?", "Monday", "7:02 PM"),
            GroupMessage("m3", "g-batch-d-int", "Togetha Team", "Fort day is on the itinerary for everyone, but the hike up is optional — there's a café crew every batch.", "Monday", "7:15 PM"),
            GroupMessage("m4", "g-batch-d-int", "Sana", "the golden hour photos from last batch sold me ngl", "Tuesday", "9:20 AM"),
        ),
    )

    private fun seedTravelersMessages(groupId: String, batchName: String) {
        groupMessages.getOrPut(groupId) {
            mutableListOf(
                GroupMessage("t1", groupId, "Togetha Team", "Welcome to the $batchName travelers group — everyone here has paid their deposit. Screening decisions land in 24–36h.", "Today", "10:04 AM"),
                GroupMessage("t2", groupId, "Aisha", "hi everyone!! who's coming from Bangalore?", "Today", "10:31 AM"),
                GroupMessage("t3", groupId, "Rohan", "Delhi here. Already packing, no shame.", "Today", "10:35 AM"),
            )
        }
    }

    // --- Support queries -------------------------------------------------------

    private val queries = mutableListOf(
        SupportQuery("qr1", "Refund timeline", "If screening doesn't work out, how long does the refund take?", "resolved", "12 Jul", "Refunds land in 5–7 business days to the original payment method."),
    )

    // --- API impl --------------------------------------------------------------

    /** Static presentation content (itineraries, taglines, colors) keyed by slug — merged with live rows. */
    fun batchTemplates(): List<Batch> = batches

    override suspend fun fetchBatches(): List<Batch> { delay(350); return batches }

    override suspend fun fetchApplication(): Application? { delay(250); return application?.copy(kycStatus = kycStatus) }

    override suspend fun submitQuiz(answers: Map<String, String>): Boolean { delay(400); return true }

    override suspend fun submitApplication(batchId: String, departureId: String, plan: PaymentPlan, form: Map<String, String>): Application {
        delay(600)
        val app = Application(
            id = "app-${System.currentTimeMillis()}", batchId = batchId, departureId = departureId,
            status = ApplicationStatus.PENDING, plan = plan, appliedAt = "Today",
            depositPaid = false, balancePaid = false, kycStatus = kycStatus,
        )
        application = app
        return app
    }

    override suspend fun createOrder(applicationId: String, kind: String): OrderResult {
        delay(700)
        val app = application
        val batch = batches.firstOrNull { it.id == app?.batchId } ?: batches.first()
        val amount = when (kind) {
            "deposit" -> batch.depositInr
            "full" -> batch.priceInr
            else -> batch.priceInr - batch.depositInr
        }
        if (app != null) {
            application = when (kind) {
                "deposit" -> app.copy(depositPaid = true, status = ApplicationStatus.DEPOSIT_PAID)
                "full" -> app.copy(depositPaid = true, balancePaid = true, status = ApplicationStatus.PAID, plan = PaymentPlan.FULL)
                else -> app.copy(balancePaid = true, status = ApplicationStatus.PAID)
            }
            // Deposit paid → auto-pull into the batch Travelers group.
            if (!batch.waitlistOnly && myGroups.none { it.id == "g-${batch.id}-trav" }) {
                myGroups.add(0, travelersGroup(batch, 17, "Togetha Team: Welcome — everyone here has paid their deposit."))
                seedTravelersMessages("g-${batch.id}-trav", batch.name)
            }
        }
        return OrderResult("order_mock_${System.currentTimeMillis()}", amount, kind)
    }

    /** Demo helper: simulate the screening team approving — starts the 48h balance window. */
    fun simulateApproval() {
        val app = application ?: return
        if (app.status == ApplicationStatus.DEPOSIT_PAID) {
            application = app.copy(status = ApplicationStatus.APPROVED, balanceDeadline = "48h from approval")
        }
    }

    override suspend fun fetchFeed(): List<TripPhoto> { delay(300); return myUploads + feed }

    fun addPendingUpload(caption: String): TripPhoto {
        val photo = TripPhoto(
            id = "mine-${System.currentTimeMillis()}", batchId = "batch-a",
            batchName = "Himalayan Love Trail", url = "", caption = caption,
            approved = false, isMine = true, tint = 0xFF556B5F,
        )
        myUploads.add(0, photo)
        return photo
    }

    override suspend fun fetchChatGroups(): List<ChatGroup> { delay(250); return myGroups.toList() }

    override suspend fun fetchGroupMessages(groupId: String): List<GroupMessage> {
        delay(200)
        return groupMessages[groupId]?.toList().orEmpty()
    }

    override suspend fun sendGroupMessage(groupId: String, text: String): GroupMessage {
        delay(150)
        val msg = GroupMessage("me-${System.currentTimeMillis()}", groupId, "You", text, "Today", "now")
        groupMessages.getOrPut(groupId) { mutableListOf() }.add(msg)
        myGroups.replaceAll { if (it.id == groupId) it.copy(lastMessage = "You: $text") else it }
        return msg
    }

    override suspend fun fetchQueries(): List<SupportQuery> { delay(200); return queries.toList() }

    override suspend fun submitQuery(subject: String, body: String): SupportQuery {
        delay(400)
        val q = SupportQuery("qr-${System.currentTimeMillis()}", subject, body, "open", "Today")
        queries.add(0, q)
        return q
    }

    override suspend fun submitKyc(form: KycForm): KycStatus {
        delay(500)
        kycStatus = KycStatus.SUBMITTED
        application = application?.copy(kycStatus = KycStatus.SUBMITTED)
        return kycStatus
    }

    override suspend fun joinWaitlist(batchId: String, email: String): Boolean { delay(500); return true }

    override suspend fun trackEvents(events: List<AnalyticsEvent>) {
        events.forEach { Log.d("Engagement", "${it.name} ${it.props} session=${it.sessionId}") }
    }

    // --- Tia -------------------------------------------------------------------

    override suspend fun sendTiaMessage(history: List<ChatMessage>, text: String): ChatMessage {
        delay(650)
        val t = text.lowercase()
        val app = application
        val reply = when {
            "booking" in t || "status" in t || "my application" in t -> tiaBookingStatus(app)
            "departure" in t || "upcoming" in t || "date" in t || "schedule" in t || "when" in t ->
                "Upcoming Friday departures:\n" + batches.filter { !it.waitlistOnly }.joinToString("\n") { b ->
                    "• ${b.name} (${b.duration}, ₹${b.priceInr}, ages ${b.ageBand}): ${b.departures.take(2).joinToString(" · ") { it.date }}"
                } + "\nWe alternate editions every Friday — a new batch runs each week."
            "queries" in t || "feedback" in t || "ticket" in t ->
                if (queries.isEmpty()) "You haven't raised any queries yet. You can submit one from Account → My queries & feedback."
                else "Your queries:\n" + queries.joinToString("\n") { "• ${it.subject} — ${it.status}${it.reply?.let { r -> " · \"$r\"" } ?: ""}" }
            "screen" in t || "approve" in t || "reject" in t || "how long" in t ->
                "Every application is reviewed by a real person — decision in 24–36 hours. Once you're approved you get a 48-hour window to pay the balance; miss it and the slot is released. I can't speed screening up or promise an outcome — that's the point."
            "refund" in t || "cancel" in t ->
                "Refunds take 5–7 business days back to your original payment method. Cancellations carry a ₹999 fee. The 30% deposit books your screening slot — if the team decides it's not a fit, it comes straight back."
            "deposit" in t || "pay" in t || "price" in t || "cost" in t ->
                "Every trip is a 30% slot-booking deposit now, rest after you're approved. Himalayan Love Trail is ₹9,999 (₹3,000 now), Udaipur Love Trail is ₹13,999 (₹4,200 now). The deposit reserves a screening slot — it never confirms a seat."
            "support" in t || "contact" in t || "whatsapp" in t || "hours" in t || "company" in t ->
                "Support runs Monday–Saturday, 10:00 AM–7:00 PM IST. WhatsApp us at +91 70541 83391. Refunds take 5–7 business days, cancellation fee is ₹999, and the 30% deposit books your slot."
            "safe" in t || "women" in t || "solo" in t ->
                "Every departure is capped at 12 women and 12 men, everyone is identity-verified and human-screened, and trip leads are trained for it. You're never the only solo woman in the room."
            "match" in t || "partner" in t ->
                "Our quiz builds a 12-dimension read of you and matches you onto a batch where the chemistry genuinely fits. It's curated travel, not a dating guarantee — what happens on the trip is yours."
            "hi" in t || "hello" in t || "hey" in t ->
                "Hi, I'm Tia. I can look up your booking status, upcoming departures, your queries, or explain how screening works — ask away."
            else ->
                "Short version: you apply, pay a 30% deposit to reserve a screening slot, a human reviews you in 24–36 hours, and if approved you pay the balance within 48 hours. Want me to check your booking status or the departure schedule?"
        }
        return ChatMessage("tia-${System.currentTimeMillis()}", "tia", reply, System.currentTimeMillis())
    }

    private fun tiaBookingStatus(app: Application?): String {
        if (app == null) return "You don't have an application yet. Take the quiz on Discover — it decides which edition you belong in."
        val batch = batches.firstOrNull { it.id == app.batchId }
        val balance = batch?.let { it.priceInr - it.depositInr } ?: 0
        return when (app.status) {
            ApplicationStatus.PENDING -> "Your application for ${batch?.name} is in — the deposit hasn't gone through yet, so your screening slot isn't reserved."
            ApplicationStatus.DEPOSIT_PAID -> "Deposit paid for ${batch?.name} — your profile is under human review (24–36h). KYC: ${app.kycStatus.name.lowercase()}. Balance due after approval: ₹$balance."
            ApplicationStatus.APPROVED -> "You're approved for ${batch?.name}! Pay the balance of ₹$balance within your 48-hour window (${app.balanceDeadline ?: "48h"}) or the slot is released."
            ApplicationStatus.PAID -> "You're a confirmed traveler on ${batch?.name}. See you on the bus."
            ApplicationStatus.REJECTED -> "This one wasn't a fit — your deposit refund is on its way (5–7 business days)."
            ApplicationStatus.EXPIRED -> "Your 48-hour balance window passed, so the slot was released. Your deposit refund is being processed."
        }
    }

    override suspend fun fetchProfile(): Profile {
        delay(200)
        return Profile(
            id = "u1", fullName = "Mrinal Raj", email = "mrinal2024cse@gmail.com",
            city = "Bengaluru", gender = "Male", age = 24,
            verified = true, idVerified = true, phoneVerified = true,
        )
    }

    override suspend fun fetchPayments(): List<PaymentRecord> {
        delay(200)
        val app = application ?: return emptyList()
        val batch = batches.firstOrNull { it.id == app.batchId } ?: return emptyList()
        val records = mutableListOf<PaymentRecord>()
        if (app.plan == PaymentPlan.FULL && app.balancePaid) {
            records += PaymentRecord("pay0", "${batch.name} — full payment", batch.priceInr, "Today", "Paid")
        } else {
            if (app.depositPaid) records += PaymentRecord("pay1", "${batch.name} — slot-booking deposit (30%)", batch.depositInr, "Today", "Paid")
            if (app.balancePaid) records += PaymentRecord("pay2", "${batch.name} — balance", batch.priceInr - batch.depositInr, "Today", "Paid")
        }
        return records
    }
}

// --- Live Supabase wire types (shared prod schema — see backend/PROD_SCHEMA.md) ---

@Serializable
internal data class BatchRow(
    val slug: String,
    val name: String? = null,
    val price: Int? = null,                       // INTEGER rupees; null for batch-c (mystery)
    val status: String = "open",                  // open | sold_out | waitlist | coming_soon
    @SerialName("spots_taken_m") val spotsTakenM: Int = 0,
    @SerialName("spots_taken_f") val spotsTakenF: Int = 0,
    @SerialName("max_spots_m") val maxSpotsM: Int = 12,
    @SerialName("max_spots_f") val maxSpotsF: Int = 12,
    @SerialName("deposit_percent") val depositPercent: Int = 30,
)

@Serializable
internal data class DepartureRow(
    val id: String,
    @SerialName("batch_slug") val batchSlug: String,
    val label: String = "",
    val sublabel: String? = null,
    val status: String = "open",
    @SerialName("spots_m") val spotsM: Int = 12,
    @SerialName("spots_f") val spotsF: Int = 12,
    @SerialName("spots_taken_m") val spotsTakenM: Int = 0,
    @SerialName("spots_taken_f") val spotsTakenF: Int = 0,
    @SerialName("sort_order") val sortOrder: Int = 0,
)

@Serializable
internal data class TripPhotoRow(
    val id: String,
    @SerialName("batch_slug") val batchSlug: String? = null,
    @SerialName("storage_path") val storagePath: String? = null,
    val caption: String? = null,
    val status: String = "approved",
)

internal val wireJson = Json { ignoreUnknownKeys = true; coerceInputValues = true }

/**
 * Pure mapping from prod REST rows → UI [Batch] models. Presentation-only content
 * (tagline, route, itinerary, cover color) comes from bundled templates keyed by slug;
 * everything commercial (price, deposit, spots, departures) comes from the live rows.
 * Extracted as a top-level function so it is unit-testable against recorded JSON.
 */
internal fun mapLiveBatches(batchesJson: String, departuresJson: String, templates: List<Batch>): List<Batch> {
    val rows = wireJson.decodeFromString<List<BatchRow>>(batchesJson)
    val deps = wireJson.decodeFromString<List<DepartureRow>>(departuresJson)
        .filter { it.status == "open" }
        .groupBy { it.batchSlug }
    val mapped = rows.map { row ->
        val base = templates.firstOrNull { it.id == row.slug }
        val price = row.price
        Batch(
            id = row.slug,
            slug = base?.slug ?: row.slug,
            name = row.name ?: base?.name ?: row.slug,
            tagline = base?.tagline ?: "",
            route = base?.route ?: "",
            duration = base?.duration ?: "",
            ageMin = base?.ageMin ?: 18,
            ageMax = base?.ageMax ?: 36,
            priceInr = price ?: 0,
            depositInr = price?.let { it * row.depositPercent / 100 } ?: 0,
            womenCapacity = row.maxSpotsF,
            menCapacity = row.maxSpotsM,
            womenCount = row.spotsTakenF.coerceIn(0, row.maxSpotsF),
            menCount = row.spotsTakenM.coerceIn(0, row.maxSpotsM),
            coverColor = base?.coverColor ?: 0xFF2E4A42,
            waitlistOnly = price == null || row.status != "open",
            departures = deps[row.slug].orEmpty().sortedBy { it.sortOrder }.map { d ->
                Departure(
                    id = d.id,
                    date = d.label,
                    womenLeft = (d.spotsF - d.spotsTakenF).coerceAtLeast(0),
                    menLeft = (d.spotsM - d.spotsTakenM).coerceAtLeast(0),
                )
            },
            itinerary = base?.itinerary.orEmpty(),
            highlights = base?.highlights.orEmpty(),
        )
    }
    // Keep the curated template order; append waitlist-only cards (e.g. batch-c,
    // filtered out by status=eq.open) so the mystery edition still shows.
    val extras = templates.filter { t -> t.waitlistOnly && mapped.none { it.id == t.id } }
    return (mapped + extras).sortedBy { b -> templates.indexOfFirst { it.id == b.id }.let { if (it < 0) Int.MAX_VALUE else it } }
}

internal fun mapLiveFeed(photosJson: String, templates: List<Batch>): List<TripPhoto> =
    wireJson.decodeFromString<List<TripPhotoRow>>(photosJson).map { row ->
        val batch = templates.firstOrNull { it.id == row.batchSlug }
        TripPhoto(
            id = row.id,
            batchId = row.batchSlug ?: "",
            batchName = batch?.name ?: "Togetha trips",
            url = row.storagePath.orEmpty(),
            caption = row.caption.orEmpty(),
            approved = true,
            tint = batch?.coverColor ?: 0xFF1F3A34,
        )
    }

/**
 * Live client against the shared production Supabase (togetha.club).
 *
 * - Read paths (batches, departures, feed) hit PostgREST with the anon key; RLS
 *   allows public SELECT on those tables.
 * - Tia and analytics go through edge functions ({FUNCTIONS_URL}/tia-chat, /track-event).
 * - Auth is still mocked, so every account-scoped method delegates to [MockApiClient].
 *   TODO(auth): replace delegation with real Supabase auth + RLS-scoped queries.
 * - Any network/decode failure on batches falls back to the bundled mock catalogue
 *   (logged) so Discover never breaks.
 */
class LiveApiClient(
    private val fallback: MockApiClient,
    private val supabaseUrl: String = BuildConfig.SUPABASE_URL,
    private val supabaseAnonKey: String = BuildConfig.SUPABASE_ANON_KEY,
    private val functionsUrl: String = BuildConfig.FUNCTIONS_URL,
) : ApiClient {

    private val restUrl = "$supabaseUrl/rest/v1"

    private fun request(method: String, url: String, body: String? = null): String {
        val conn = URL(url).openConnection() as HttpURLConnection
        return try {
            conn.requestMethod = method
            conn.connectTimeout = 10_000
            conn.readTimeout = 15_000
            conn.setRequestProperty("apikey", supabaseAnonKey)
            conn.setRequestProperty("Authorization", "Bearer $supabaseAnonKey")
            conn.setRequestProperty("Accept", "application/json")
            if (body != null) {
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            }
            val code = conn.responseCode
            val text = (if (code in 200..299) conn.inputStream else conn.errorStream)
                ?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (code !in 200..299) throw IllegalStateException("HTTP $code from $url: ${text.take(200)}")
            text
        } finally {
            conn.disconnect()
        }
    }

    private suspend fun get(url: String): String = withContext(Dispatchers.IO) { request("GET", url) }
    private suspend fun post(url: String, body: String): String = withContext(Dispatchers.IO) { request("POST", url, body) }

    override suspend fun fetchBatches(): List<Batch> = try {
        val batchesJson = get("$restUrl/batches?select=*&status=eq.open")
        val departuresJson = get("$restUrl/batch_departures?select=*&status=eq.open&order=sort_order")
        mapLiveBatches(batchesJson, departuresJson, fallback.batchTemplates())
    } catch (t: Throwable) {
        Log.w(TAG, "fetchBatches: live fetch failed, using bundled catalogue", t)
        fallback.fetchBatches()
    }

    override suspend fun fetchFeed(): List<TripPhoto> = try {
        mapLiveFeed(
            get("$restUrl/trip_photos?select=*&status=in.(approved,featured)&order=created_at.desc"),
            fallback.batchTemplates(),
        )
    } catch (t: Throwable) {
        // trip_photos ships with the mobile prod migration — empty (with an empty
        // state in the UI) until it runs. Never surface an error here.
        Log.w(TAG, "fetchFeed: live fetch failed, showing empty feed", t)
        emptyList()
    }

    override suspend fun sendTiaMessage(history: List<ChatMessage>, text: String): ChatMessage = try {
        val messages = buildJsonArray {
            (history.takeLast(20) + ChatMessage("out", "user", text, System.currentTimeMillis())).forEach { m ->
                add(buildJsonObject {
                    put("role", if (m.role == "tia") "assistant" else "user")
                    put("content", m.text)
                })
            }
        }
        val body = buildJsonObject { put("messages", messages) }.toString()
        val reply = wireJson.parseToJsonElement(post("$functionsUrl/tia-chat", body))
            .jsonObject["reply"]?.jsonPrimitive?.contentOrNull
        if (reply.isNullOrBlank()) throw IllegalStateException("empty reply")
        ChatMessage("tia-${System.currentTimeMillis()}", "tia", reply, System.currentTimeMillis())
    } catch (t: Throwable) {
        // Edge function needs a user JWT; until auth lands (or offline) Tia answers locally.
        Log.w(TAG, "sendTiaMessage: falling back to local Tia", t)
        fallback.sendTiaMessage(history, text)
    }

    /** Fire-and-forget: maps app events to the track-event contract, swallows every failure. */
    override suspend fun trackEvents(events: List<AnalyticsEvent>) {
        if (events.isEmpty()) return
        runCatching {
            val payload = buildJsonObject {
                put("events", buildJsonArray {
                    events.take(20).forEach { e ->
                        add(buildJsonObject {
                            put("session_id", e.sessionId)
                            put("event_type", e.name)
                            val (refType, refId) = when (e.name) {
                                "listing_view", "listing_click", "apply_start" -> "batch" to (e.props["batch_id"] ?: "unknown")
                                "quiz_start" -> "quiz" to "quiz"
                                "screen_view" -> "screen" to (e.props["screen"] ?: "unknown")
                                else -> "screen" to (e.props["screen"] ?: e.name)
                            }
                            put("ref_type", refType)
                            put("ref_id", refId)
                            e.props["dwell_seconds"]?.toLongOrNull()?.let { put("dwell_seconds", it) }
                            put("metadata", buildJsonObject { e.props.forEach { (k, v) -> put(k, v) } })
                        })
                    }
                })
            }
            post("$functionsUrl/track-event", payload.toString())
        }.onFailure { Log.d(TAG, "trackEvents dropped: ${it.message}") }
    }

    // --- Account-scoped surfaces stay on the mock until Supabase auth lands. ---
    // TODO(auth): implement against applicants/profiles/chat_* with a real user session.
    override suspend fun fetchApplication(): Application? = fallback.fetchApplication()
    override suspend fun submitQuiz(answers: Map<String, String>): Boolean = fallback.submitQuiz(answers)
    override suspend fun submitApplication(batchId: String, departureId: String, plan: PaymentPlan, form: Map<String, String>): Application =
        fallback.submitApplication(batchId, departureId, plan, form)
    override suspend fun createOrder(applicationId: String, kind: String): OrderResult = fallback.createOrder(applicationId, kind)
    override suspend fun fetchProfile(): Profile = fallback.fetchProfile()
    override suspend fun fetchPayments(): List<PaymentRecord> = fallback.fetchPayments()
    override suspend fun fetchChatGroups(): List<ChatGroup> = fallback.fetchChatGroups()
    override suspend fun fetchGroupMessages(groupId: String): List<GroupMessage> = fallback.fetchGroupMessages(groupId)
    override suspend fun sendGroupMessage(groupId: String, text: String): GroupMessage = fallback.sendGroupMessage(groupId, text)
    override suspend fun fetchQueries(): List<SupportQuery> = fallback.fetchQueries()
    override suspend fun submitQuery(subject: String, body: String): SupportQuery = fallback.submitQuery(subject, body)
    override suspend fun submitKyc(form: KycForm): KycStatus = fallback.submitKyc(form)
    override suspend fun joinWaitlist(batchId: String, email: String): Boolean = fallback.joinWaitlist(batchId, email)

    private companion object { const val TAG = "LiveApi" }
}

/**
 * Simple service locator for this stage of the app.
 * Uses [MockApiClient] while BuildConfig.SUPABASE_URL is blank; with the shared
 * prod Supabase configured it runs [LiveApiClient] (mock retained as fallback).
 */
object Api {
    val mock = MockApiClient()
    val client: ApiClient =
        if (BuildConfig.SUPABASE_URL.isBlank()) mock else LiveApiClient(fallback = mock)
}

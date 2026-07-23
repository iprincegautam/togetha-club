package club.togetha.app.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Exact raw pipeline values used by the backend. */
@Serializable
enum class ApplicationStatus {
    @SerialName("pending") PENDING,
    @SerialName("deposit_paid") DEPOSIT_PAID,
    @SerialName("paid") PAID,
    @SerialName("approved") APPROVED,
    @SerialName("rejected") REJECTED,
    @SerialName("expired") EXPIRED,
}

@Serializable
enum class KycStatus {
    @SerialName("pending") PENDING,
    @SerialName("submitted") SUBMITTED,
    @SerialName("approved") APPROVED,
}

@Serializable
enum class VerificationStatus {
    @SerialName("unverified") UNVERIFIED,
    @SerialName("submitted") SUBMITTED,
    @SerialName("verified") VERIFIED,
}

@Serializable
enum class PaymentPlan {
    @SerialName("deposit") DEPOSIT,
    @SerialName("full") FULL,
}

@Serializable
data class Departure(
    @SerialName("id") val id: String,
    @SerialName("date") val date: String,        // e.g. "Fri, 14 Aug 2026"
    @SerialName("women_left") val womenLeft: Int,
    @SerialName("men_left") val menLeft: Int,
)

@Serializable
data class Batch(
    @SerialName("id") val id: String,
    @SerialName("slug") val slug: String,
    @SerialName("name") val name: String,
    @SerialName("tagline") val tagline: String,
    @SerialName("route") val route: String,
    @SerialName("duration") val duration: String,        // "5N/6D"
    @SerialName("age_min") val ageMin: Int,
    @SerialName("age_max") val ageMax: Int,
    @SerialName("price_inr") val priceInr: Int,
    @SerialName("deposit_inr") val depositInr: Int,      // 30% of price
    @SerialName("women_capacity") val womenCapacity: Int = 12,
    @SerialName("men_capacity") val menCapacity: Int = 12,
    @SerialName("women_count") val womenCount: Int = 0,
    @SerialName("men_count") val menCount: Int = 0,
    @SerialName("cover_color") val coverColor: Long,
    @SerialName("waitlist_only") val waitlistOnly: Boolean = false,
    @SerialName("departures") val departures: List<Departure> = emptyList(),
    @SerialName("itinerary") val itinerary: List<ItineraryDay> = emptyList(),
    @SerialName("highlights") val highlights: List<String> = emptyList(),
) {
    val ageBand: String get() = "$ageMin–$ageMax"
    val spotsLeft: Int get() = (womenCapacity - womenCount) + (menCapacity - menCount)
}

@Serializable
data class ItineraryDay(
    @SerialName("day") val day: Int,
    @SerialName("title") val title: String,
    @SerialName("description") val description: String,
)

@Serializable
data class Application(
    @SerialName("id") val id: String,
    @SerialName("batch_id") val batchId: String,
    @SerialName("departure_id") val departureId: String = "",
    @SerialName("status") val status: ApplicationStatus,
    @SerialName("kyc_status") val kycStatus: KycStatus = KycStatus.PENDING,
    @SerialName("plan") val plan: PaymentPlan = PaymentPlan.DEPOSIT,
    @SerialName("applied_at") val appliedAt: String,
    @SerialName("deposit_paid") val depositPaid: Boolean,
    @SerialName("balance_paid") val balancePaid: Boolean,
    @SerialName("balance_deadline") val balanceDeadline: String? = null, // 48h window once approved
    @SerialName("decision_eta_hours") val decisionEtaHours: Int = 36,
)

@Serializable
data class TripPhoto(
    @SerialName("id") val id: String,
    @SerialName("batch_id") val batchId: String,
    @SerialName("batch_name") val batchName: String,
    @SerialName("url") val url: String,
    @SerialName("caption") val caption: String,
    @SerialName("approved") val approved: Boolean,
    @SerialName("is_mine") val isMine: Boolean = false,
    @SerialName("tint") val tint: Long = 0xFF1F3A34,
)

@Serializable
enum class QuizType {
    @SerialName("number") NUMBER,
    @SerialName("choice") CHOICE,
    @SerialName("slider") SLIDER,
    @SerialName("text") TEXT,
    @SerialName("departure") DEPARTURE,
}

@Serializable
data class QuizQuestion(
    @SerialName("id") val id: String,
    @SerialName("type") val type: QuizType,
    @SerialName("question") val question: String,
    @SerialName("subtitle") val subtitle: String = "",
    @SerialName("options") val options: List<String> = emptyList(),
)

@Serializable
data class ChatMessage(
    @SerialName("id") val id: String,
    @SerialName("role") val role: String, // "user" | "tia"
    @SerialName("text") val text: String,
    @SerialName("timestamp") val timestamp: Long,
)

@Serializable
data class ChatGroup(
    @SerialName("id") val id: String,
    @SerialName("batch_id") val batchId: String,
    @SerialName("name") val name: String,
    @SerialName("kind") val kind: String, // "interested" | "travelers"
    @SerialName("member_count") val memberCount: Int,
    @SerialName("last_message") val lastMessage: String,
    @SerialName("tint") val tint: Long,
)

@Serializable
data class GroupMessage(
    @SerialName("id") val id: String,
    @SerialName("group_id") val groupId: String,
    @SerialName("sender") val sender: String, // "You" for self
    @SerialName("text") val text: String,
    @SerialName("day") val day: String,       // day-separator label, e.g. "Monday"
    @SerialName("time") val time: String,     // "6:41 PM"
)

@Serializable
data class SupportQuery(
    @SerialName("id") val id: String,
    @SerialName("subject") val subject: String,
    @SerialName("body") val body: String,
    @SerialName("status") val status: String, // "open" | "resolved"
    @SerialName("created_at") val createdAt: String,
    @SerialName("reply") val reply: String? = null,
)

@Serializable
data class Profile(
    @SerialName("id") val id: String,
    @SerialName("full_name") val fullName: String,
    @SerialName("email") val email: String,
    @SerialName("city") val city: String,
    @SerialName("gender") val gender: String,
    @SerialName("age") val age: Int,
    @SerialName("verified") val verified: Boolean,
    @SerialName("id_verified") val idVerified: Boolean,
    @SerialName("phone_verified") val phoneVerified: Boolean,
)

@Serializable
data class KycForm(
    @SerialName("bio") val bio: String,
    @SerialName("city") val city: String,
    @SerialName("emergency_contact") val emergencyContact: String,
    @SerialName("dietary_notes") val dietaryNotes: String,
    @SerialName("instagram") val instagram: String,
)

@Serializable
data class PaymentRecord(
    @SerialName("id") val id: String,
    @SerialName("label") val label: String,
    @SerialName("amount_inr") val amountInr: Int,
    @SerialName("date") val date: String,
    @SerialName("status") val status: String,
)

@Serializable
data class OrderResult(
    @SerialName("order_id") val orderId: String,
    @SerialName("amount_inr") val amountInr: Int,
    @SerialName("kind") val kind: String, // "deposit" | "full" | "balance"
)

@Serializable
data class AnalyticsEvent(
    @SerialName("session_id") val sessionId: String,
    @SerialName("name") val name: String,
    @SerialName("props") val props: Map<String, String> = emptyMap(),
    @SerialName("timestamp") val timestamp: Long,
)

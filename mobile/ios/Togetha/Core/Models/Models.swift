import Foundation
import SwiftUI

// MARK: - Batch

enum BatchEdition: String, Codable, Hashable {
    case genZ = "genz"
    case millennial = "millennial"
    case mystery = "mystery"

    var label: String {
        switch self {
        case .genZ: "GenZ Edition"
        case .millennial: "Millennial Edition"
        case .mystery: "Mystery Edition"
        }
    }
}

struct Batch: Identifiable, Codable, Hashable {
    /// The production `batches.slug` ("batch-a" … "batch-e") — the canonical id.
    let id: String
    /// Marketing slug ("himalayan-genz"); presentational only.
    let slug: String
    let name: String
    let edition: BatchEdition
    let tagline: String
    let region: String
    let route: String          // "Manali · Kasol · Sissu"
    let durationText: String   // "5N/6D"
    let price: Int?            // INTEGER rupees from prod `batches.price`; nil for the mystery batch
    let depositPercent: Int    // prod `batches.deposit_percent` (25–30)
    let ageMin: Int
    let ageMax: Int
    let departures: [Date]     // alternating Friday departures
    let womenCount: Int
    let menCount: Int
    let womenCapacity: Int     // 12 women per departure
    let menCapacity: Int       // 12 men per departure
    let itinerary: [ItineraryDay]
    let highlights: [String]
    let heroColorHex: UInt32
    let isWaitlistOnly: Bool

    /// Total price in rupees (0 for the price-less mystery batch — UI hides it there).
    var priceTotal: Int { price ?? 0 }
    /// Deposit = price × deposit_percent / 100 (prod math).
    var depositAmount: Int { Int((Double(priceTotal) * Double(depositPercent) / 100).rounded()) }
    var balanceAmount: Int { priceTotal - depositAmount }
    var capacity: Int { womenCapacity + menCapacity }
    var spotsLeft: Int { max(0, capacity - womenCount - menCount) }
    var heroColor: Color { Color(hex: heroColorHex) }
    var ageBandText: String { "Ages \(ageMin)–\(ageMax)" }

    /// "✦ Pay ₹X now · rest after you're approved"
    var depositCopy: String { "✦ Pay \(depositAmount.inr) now · rest after you're approved" }

    var nextDepartureText: String {
        guard let next = departures.first else { return "Dates announced soon" }
        let f = DateFormatter()
        f.dateFormat = "EEE d MMM yyyy"
        return f.string(from: next)
    }

    enum CodingKeys: String, CodingKey {
        case id, slug, name, edition, tagline, region, route, itinerary, highlights, departures
        case price
        case durationText = "duration_text"
        case depositPercent = "deposit_percent"
        case ageMin = "age_min"
        case ageMax = "age_max"
        case womenCount = "women_count"
        case menCount = "men_count"
        case womenCapacity = "women_capacity"
        case menCapacity = "men_capacity"
        case heroColorHex = "hero_color_hex"
        case isWaitlistOnly = "is_waitlist_only"
    }
}

struct ItineraryDay: Codable, Hashable, Identifiable {
    let day: Int
    let title: String
    let detail: String
    var id: Int { day }
}

// MARK: - Application status pipeline (exact raw values)

enum ApplicationStatus: String, Codable, CaseIterable {
    case pending
    case depositPaid = "deposit_paid"
    case approved      // profile approved → 48-hour balance window opens
    case paid          // balance paid — confirmed traveler
    case rejected
    case expired       // missed the 48h window, slot released

    var label: String {
        switch self {
        case .pending: "Applied"
        case .depositPaid: "Deposit paid"
        case .approved: "Approved — pay balance"
        case .paid: "Confirmed traveler"
        case .rejected: "Not a fit this time"
        case .expired: "Window expired"
        }
    }
}

enum KycStatus: String, Codable {
    case pending
    case submitted
    case approved

    var label: String {
        switch self {
        case .pending: "Profile incomplete"
        case .submitted: "Profile submitted — under review"
        case .approved: "Profile approved"
        }
    }
}

enum PaymentPlan: String, Codable, CaseIterable {
    case deposit
    case full

    var label: String {
        switch self {
        case .deposit: "30% deposit"
        case .full: "Pay in full"
        }
    }
}

struct Application: Identifiable, Codable, Hashable {
    let id: String
    let batchId: String
    let batchName: String
    var status: ApplicationStatus
    var kycStatus: KycStatus
    var paymentPlan: PaymentPlan
    let appliedAt: Date
    var departureDate: Date?
    var balanceDueDeadline: Date?   // set when status becomes .approved (48h window)
    var depositPaid: Bool
    var balancePaid: Bool
    /// Did this user already finish the quiz? (from applicants.quiz_score). Used
    /// to gate the onboarding quiz per-user instead of per-device. Not persisted.
    var quizTaken: Bool = false

    enum CodingKeys: String, CodingKey {
        case id, status
        case batchId = "batch_id"
        case batchName = "batch_name"
        case kycStatus = "kyc_status"
        case paymentPlan = "payment_plan"
        case appliedAt = "applied_at"
        case departureDate = "departure_date"
        case balanceDueDeadline = "balance_due_deadline"
        case depositPaid = "deposit_paid"
        case balancePaid = "balance_paid"
    }
}

// MARK: - Trip logistics (post-booking; gated by approved + paid)
//
// Mirrors the website's `departure_logistics` row (pickup / vehicle / guide /
// times). `stays` is net-new for mobile — hotel photos of the booked trip.
// The guide's phone is a privacy gate: only surfaced once a human has approved
// the applicant AND a payment exists (enforced server-side by the edge function).

struct StayHotel: Identifiable, Hashable {
    let id: String
    let name: String
    let location: String
    let nights: Int
    let note: String
    var imageName: String? = nil
}

struct DepartureLogistics: Hashable {
    // Getting there
    let pickupLocation: String
    let reportingTime: String
    let departureTime: String
    // Coming back
    let arrivalTime: String
    // Vehicle
    let vehicleNumber: String
    // Guide (shared only when approved + paid)
    let guideName: String
    let guidePhone: String
    let guideEmail: String
    // Stays — hotel photos of the booked trip (mobile-only)
    let stays: [StayHotel]

    /// Placeholder for fields the ops team hasn't filled yet (website copy).
    static let tbc = "To be confirmed"
}

// MARK: - Feed

enum PhotoReviewState: String, Codable {
    case pending
    case approved
}

struct TripPhoto: Identifiable, Codable, Hashable {
    let id: String
    let batchId: String
    let batchName: String
    let caption: String
    let uploaderName: String
    let isOwn: Bool
    var reviewState: PhotoReviewState
    let colorHex: UInt32
    let aspectRatio: Double
    var imageName: String? = nil

    var color: Color { Color(hex: colorHex) }

    enum CodingKeys: String, CodingKey {
        case id, caption
        case batchId = "batch_id"
        case batchName = "batch_name"
        case uploaderName = "uploader_name"
        case isOwn = "is_own"
        case reviewState = "review_state"
        case colorHex = "color_hex"
        case aspectRatio = "aspect_ratio"
        case imageName = "image_name"
    }
}

// MARK: - Quiz

enum QuizKind: String, Codable {
    case numeric      // age entry
    case destination  // trail picker
    case choice       // single-select options
    case range        // 1–10 slider
    case text         // free text
    case departure    // Friday departure picker
}

struct QuizOption: Identifiable, Hashable {
    let text: String
    let weights: [MatchDimension: Double]
    var id: String { text }
}

struct QuizQuestion: Identifiable, Hashable {
    let id: String
    let kind: QuizKind
    let prompt: String
    let subtitle: String
    var options: [QuizOption] = []
}

// MARK: - Match engine types

enum MatchDimension: String, CaseIterable, Codable {
    case socialEnergy, directness, depth, spontaneity, emotionalAvailability
    case warmth, humor, adventure, introspection, loyalty, curiosity, authenticity
}

enum PlacementTier: String, Codable {
    case high, medium, growing

    var label: String {
        switch self {
        case .high: "High placement chance"
        case .medium: "Medium placement chance"
        case .growing: "Growing fit"
        }
    }
}

enum Archetype: String, CaseIterable, Codable {
    case bonfireRomantic = "The Bonfire Romantic"
    case chaosCatalyst = "The Chaos Catalyst"
    case thoughtfulPlanner = "The Thoughtful Planner"
    case freeSpirit = "The Free Spirit"
    case quietIntensity = "The Quiet Intensity"
    case goldenRetriever = "The Golden Retriever"

    var icon: String {
        switch self {
        case .bonfireRomantic: "flame.fill"
        case .chaosCatalyst: "sparkles"
        case .thoughtfulPlanner: "map.fill"
        case .freeSpirit: "wind"
        case .quietIntensity: "moon.stars.fill"
        case .goldenRetriever: "sun.max.fill"
        }
    }

    var blurb: String {
        switch self {
        case .bonfireRomantic: "You're the 2am deep conversation by the fire. Warmth and depth carry you."
        case .chaosCatalyst: "Rooms get louder and better when you arrive. Energy is your love language."
        case .thoughtfulPlanner: "You show love in itineraries and backup plans. Reliability is romantic."
        case .freeSpirit: "The vibe takes you places maps can't. Curiosity leads, everything else follows."
        case .quietIntensity: "You process by the river while everyone else performs. Depth over volume."
        case .goldenRetriever: "Easy warmth, quick laughter, zero games. People just feel safe around you."
        }
    }
}

struct MatchResult: Hashable, Codable {
    let score: Int              // clamped 68–97 (62 cap if outside age band)
    let archetype: Archetype
    let recommendedBatchId: String
    let recommendedBatchName: String
    let placementTier: PlacementTier
    let narrative: String
    let ageOutOfBand: Bool
}

// MARK: - Community chat

enum ChatGroupKind: String, Codable {
    case interested
    case travelers
}

struct ChatGroup: Identifiable, Hashable {
    let id: String
    let batchId: String
    let name: String        // "{Batch} · Interested" / "{Batch} · Travelers"
    let kind: ChatGroupKind
    var messages: [GroupMessage]
    var memberCount: Int
}

struct GroupMessage: Identifiable, Hashable {
    let id: String
    let senderName: String
    let isOwn: Bool
    let text: String
    let sentAt: Date

    init(id: String = UUID().uuidString, senderName: String, isOwn: Bool = false, text: String, sentAt: Date) {
        self.id = id
        self.senderName = senderName
        self.isOwn = isOwn
        self.text = text
        self.sentAt = sentAt
    }
}

// MARK: - Queries & feedback

enum QueryStatus: String, Codable {
    case open
    case inProgress = "in_progress"
    case resolved

    var label: String {
        switch self {
        case .open: "Open"
        case .inProgress: "In progress"
        case .resolved: "Resolved"
        }
    }
}

struct UserQuery: Identifiable, Hashable {
    let id: String
    let kind: String        // "Query" | "Feedback"
    let subject: String
    let detail: String
    var status: QueryStatus
    let createdAt: Date
}

// MARK: - KYC / complete profile

struct KycProfile: Hashable {
    var bio = ""
    var city = ""
    var emergencyContact = ""
    var dietaryNotes = ""
    var instagramHandle = ""
}

// MARK: - Verification ("Get verified ✓")

enum VerificationStatus: String, Codable {
    case notStarted = "not_started"
    case submitted
    case verified
    case rejected

    var label: String {
        switch self {
        case .notStarted: "Not started"
        case .submitted: "Under review"
        case .verified: "Verified"
        case .rejected: "Needs another look"
        }
    }
}

/// Age band derived from the quiz age answer — drives edition filtering on Discover.
enum AgeBand {
    case genZ        // 18–25
    case millennial  // 26–36
    case other       // outside both bands
    case unknown     // quiz not taken yet

    static func from(age: Int?) -> AgeBand {
        guard let age else { return .unknown }
        switch age {
        case 18...25: return .genZ
        case 26...36: return .millennial
        default: return .other
        }
    }
}

// MARK: - Engagement tracking

struct EngagementEvent: Codable, Hashable, Sendable {
    let name: String            // screen_view, listing_view, listing_click, apply_start, quiz_start
    let sessionId: String
    let timestamp: Date
    var screen: String? = nil
    var batchId: String? = nil
    var dwellSeconds: Double? = nil

    enum CodingKeys: String, CodingKey {
        case name, screen, timestamp
        case sessionId = "session_id"
        case batchId = "batch_id"
        case dwellSeconds = "dwell_seconds"
    }
}

// MARK: - Chat (Tia)

struct ChatMessage: Identifiable, Codable, Hashable {
    let id: String
    let role: Role
    let text: String
    let sentAt: Date

    enum Role: String, Codable { case user, tia }

    init(id: String = UUID().uuidString, role: Role, text: String, sentAt: Date = .now) {
        self.id = id
        self.role = role
        self.text = text
        self.sentAt = sentAt
    }

    enum CodingKeys: String, CodingKey {
        case id, role, text
        case sentAt = "sent_at"
    }
}

// MARK: - Profile

struct Profile: Codable, Hashable {
    let id: String
    var name: String
    var city: String
    var gender: String
    var isVerified: Bool
    var payments: [PaymentRecord]

    enum CodingKeys: String, CodingKey {
        case id, name, city, gender, payments
        case isVerified = "is_verified"
    }
}

struct PaymentRecord: Identifiable, Codable, Hashable {
    let id: String
    let label: String
    let amount: Int
    let date: Date
    let status: String
}

// MARK: - Order

struct PaymentOrder: Codable, Hashable {
    let id: String
    let amount: Int
    let currency: String
    let purpose: String
}

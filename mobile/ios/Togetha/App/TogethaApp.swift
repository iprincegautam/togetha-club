import SwiftUI
import Observation

@Observable
final class AppState {
    var application: Application?
    var pendingPhotos: [TripPhoto] = []

    // MARK: - Persisted auth + quiz + verification state

    var signedIn = UserDefaults.standard.bool(forKey: "signedIn") {
        didSet { UserDefaults.standard.set(signedIn, forKey: "signedIn") }
    }

    var quizCompleted = UserDefaults.standard.bool(forKey: "quizCompleted") {
        didSet { UserDefaults.standard.set(quizCompleted, forKey: "quizCompleted") }
    }

    var quizAnswers: [String: String] = {
        guard let data = UserDefaults.standard.data(forKey: "quizAnswers"),
              let decoded = try? JSONDecoder().decode([String: String].self, from: data) else { return [:] }
        return decoded
    }() {
        didSet {
            if let data = try? JSONEncoder().encode(quizAnswers) {
                UserDefaults.standard.set(data, forKey: "quizAnswers")
            }
        }
    }

    var lastMatchResult: MatchResult? = {
        guard let data = UserDefaults.standard.data(forKey: "lastMatchResult"),
              let decoded = try? JSONDecoder().decode(MatchResult.self, from: data) else { return nil }
        return decoded
    }() {
        didSet {
            if let result = lastMatchResult, let data = try? JSONEncoder().encode(result) {
                UserDefaults.standard.set(data, forKey: "lastMatchResult")
            } else {
                UserDefaults.standard.removeObject(forKey: "lastMatchResult")
            }
        }
    }

    var verificationStatus: VerificationStatus = VerificationStatus(
        rawValue: UserDefaults.standard.string(forKey: "verificationStatus") ?? ""
    ) ?? .notStarted {
        didSet { UserDefaults.standard.set(verificationStatus.rawValue, forKey: "verificationStatus") }
    }

    /// Age band from the quiz age answer — genz 18–25, millennial 26–36.
    var ageBand: AgeBand {
        guard quizCompleted else { return .unknown }
        return AgeBand.from(age: Int(quizAnswers["age"] ?? ""))
    }

    var isVerified: Bool { verificationStatus == .verified }

    /// Stores a finished quiz run: answers + recomputed result.
    func completeQuiz(answers: [String: String], result: MatchResult) {
        quizAnswers = answers
        lastMatchResult = result
        quizCompleted = true
    }

    // Community chat — user's groups. Seeded: Interested for Udaipur GenZ.
    var groups: [ChatGroup] = MockAPIClient.seedGroups()

    // Queries & feedback
    var queries: [UserQuery] = MockAPIClient.seedQueries()

    // KYC / complete profile
    var kycProfile = KycProfile()

    var payments: [PaymentRecord] = []

    func advance(to status: ApplicationStatus) {
        application?.status = status
        switch status {
        case .approved:
            application?.balanceDueDeadline = Date.now.addingTimeInterval(48 * 3600)
        case .paid:
            application?.balancePaid = true
        default:
            break
        }
    }

    /// Deposit paid → status deposit_paid + auto-pull into the batch's Travelers group.
    func markDepositPaid(for batch: Batch, plan: PaymentPlan) {
        application?.depositPaid = true
        application?.paymentPlan = plan
        advance(to: .depositPaid)
        let amount = plan == .full ? batch.priceTotal : batch.depositAmount
        payments.append(PaymentRecord(
            id: UUID().uuidString,
            label: "\(plan == .full ? "Full payment" : "Deposit") — \(batch.name)",
            amount: amount, date: .now, status: "Paid"
        ))
        if plan == .full { application?.balancePaid = true }
        joinTravelersGroup(for: batch)
    }

    func joinTravelersGroup(for batch: Batch) {
        let group = MockAPIClient.travelersGroup(for: batch)
        guard !groups.contains(where: { $0.id == group.id }) else { return }
        groups.insert(group, at: 0)
    }

    func submitKyc() {
        application?.kycStatus = .submitted
    }

    func submitQuery(kind: String, subject: String, detail: String) {
        queries.insert(
            UserQuery(id: UUID().uuidString, kind: kind, subject: subject, detail: detail, status: .open, createdAt: .now),
            at: 0
        )
    }

    func sendGroupMessage(groupId: String, text: String) {
        guard let idx = groups.firstIndex(where: { $0.id == groupId }) else { return }
        groups[idx].messages.append(GroupMessage(senderName: "You", isOwn: true, text: text, sentAt: .now))
    }
}

@main
struct TogethaApp: App {
    @State private var appState = AppState()
    // LiveAPIClient when TOGETHA_SUPABASE_URL / TOGETHA_SUPABASE_ANON_KEY are set
    // in Info.plist (via project.yml build settings); MockAPIClient otherwise.
    private let api: any APIClientProtocol = Config.makeClient()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .environment(\.api, api)
                .tint(Theme.Colors.amber)
                // Respect Text Size up to XXL; accessibility sizes would
                // explode the display serif layouts, so cap there.
                .dynamicTypeSize(.xSmall ... .xxLarge)
                .task { EngagementTracker.shared.configure(api: api) }
        }
    }
}

// Environment key for the API client.
private struct APIClientKey: EnvironmentKey {
    static let defaultValue: any APIClientProtocol = MockAPIClient()
}

extension EnvironmentValues {
    var api: any APIClientProtocol {
        get { self[APIClientKey.self] }
        set { self[APIClientKey.self] = newValue }
    }
}

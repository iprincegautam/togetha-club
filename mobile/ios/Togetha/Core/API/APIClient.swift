import Foundation

// MARK: - Protocol

protocol APIClientProtocol: Sendable {
    func fetchBatches() async throws -> [Batch]
    func fetchApplication() async throws -> Application?
    func submitQuiz(answers: [String: String]) async throws
    func submitApplication(batchId: String, form: [String: String]) async throws -> Application
    func createOrder(batchId: String, purpose: String) async throws -> PaymentOrder
    func fetchFeed() async throws -> [TripPhoto]
    func sendTiaMessage(messages: [ChatMessage], context: TiaContext?) async throws -> ChatMessage
    func joinWaitlist(batchId: String, email: String) async throws
    func trackEvents(_ events: [EngagementEvent]) async throws
    /// Post-booking trip logistics. Server enforces the approved+paid gate; the
    /// client also hides the whole screen until the local booking state qualifies.
    func fetchLogistics() async throws -> DepartureLogistics?
    /// The signed-in user's profile and payment ledger (real when authed).
    func fetchProfile() async throws -> Profile
    func fetchPayments() async throws -> [PaymentRecord]
}

/// Read-only snapshot of the user's state that Tia's mock "tools" can answer from.
struct TiaContext: Sendable {
    let application: Application?
    let queries: [UserQuery]
    let balanceDue: Int?
}

// MARK: - Config

/// Backend configuration, read from Info.plist.
///
/// The Info.plist keys `TOGETHA_SUPABASE_URL`, `TOGETHA_SUPABASE_ANON_KEY`, and
/// `TOGETHA_FUNCTIONS_URL` are populated from same-named build settings declared
/// (with empty defaults) in `project.yml`, so real values can be injected
/// per-configuration later (xcconfig / CI) without code changes.
///
/// Client selection: when the Supabase URL + anon key are both non-empty the app
/// uses `LiveAPIClient`; otherwise it falls back to `MockAPIClient` (demo data).
struct Config: Sendable {
    let supabaseURL: String
    let supabaseAnonKey: String
    let functionsURL: String
    /// Real phone-OTP auth. Off until Supabase Phone auth + an SMS provider are
    /// enabled; while off, sign-in uses the mock OTP flow so the app stays demoable.
    let phoneAuthEnabled: Bool

    static let shared = Config(
        supabaseURL: Bundle.main.object(forInfoDictionaryKey: "TOGETHA_SUPABASE_URL") as? String ?? "",
        supabaseAnonKey: Bundle.main.object(forInfoDictionaryKey: "TOGETHA_SUPABASE_ANON_KEY") as? String ?? "",
        functionsURL: Bundle.main.object(forInfoDictionaryKey: "TOGETHA_FUNCTIONS_URL") as? String ?? "",
        phoneAuthEnabled: (Bundle.main.object(forInfoDictionaryKey: "TOGETHA_PHONE_AUTH_ENABLED") as? String ?? "NO").uppercased() == "YES"
    )

    /// True when the backend is configured and `LiveAPIClient` should be used.
    var isConfigured: Bool { !supabaseURL.isEmpty && !supabaseAnonKey.isEmpty }

    /// Use real phone OTP only when configured AND phone auth is turned on.
    var usePhoneAuth: Bool { isConfigured && phoneAuthEnabled }

    /// The API client for the current configuration.
    static func makeClient() -> any APIClientProtocol {
        shared.isConfigured ? LiveAPIClient(config: shared) : MockAPIClient()
    }
}

// MARK: - Live client (shared production Supabase REST + edge functions)
//
// Talks to the togetha.club production project (see backend/PROD_SCHEMA.md).
// Read paths are live; write paths (apply / payments / quiz) stay mocked until
// auth + edge functions ship — never write to prod applicant data from here.
// TODO(auth): real Supabase OTP auth is a later round; `signedIn` is UI-only.

struct LiveAPIClient: APIClientProtocol {
    let config: Config
    private let session = URLSession.shared
    private let mock = MockAPIClient()

    // MARK: Production row DTOs

    /// `public.batches` — PK is `slug`, price is INTEGER **rupees** (nil for batch-c).
    private struct BatchRow: Decodable {
        let slug: String
        let name: String
        let price: Int?
        let status: String
        let spots_taken_m: Int?
        let spots_taken_f: Int?
        let max_spots_m: Int?
        let max_spots_f: Int?
        let deposit_percent: Int?
    }

    /// `public.batch_departures` — dated Friday departures per batch.
    private struct DepartureRow: Decodable {
        let batch_slug: String
        let departure_date: String?   // "yyyy-MM-dd"
        let sort_order: Int?
    }

    /// `public.trip_photos` (mobile prod migration — table may not exist yet).
    private struct TripPhotoRow: Decodable {
        let id: String
        let batch_id: String?
        let caption: String?
        let status: String?
    }

    private struct TiaReply: Decodable {
        let reply: String?
        let text: String?
        let message: String?
    }

    // MARK: Plumbing

    private func request(path: String, method: String = "GET", body: Data? = nil, edge: Bool = false) throws -> URLRequest {
        let base = edge ? config.functionsURL : config.supabaseURL + "/rest/v1"
        guard let url = URL(string: base + path) else { throw URLError(.badURL) }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.httpBody = body
        req.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        // Signed-in user's JWT when we have one (from AuthService), else the anon
        // key — so RLS-scoped, account-owned reads/writes act as the real user.
        let bearer = AuthService.bearerToken ?? config.supabaseAnonKey
        req.setValue("Bearer \(bearer)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return req
    }

    private func run<T: Decodable>(_ req: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private static let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Kolkata")
        return f
    }()

    // MARK: Batches (live, graceful fallback to bundled mocks)

    func fetchBatches() async throws -> [Batch] {
        do {
            async let batchRows: [BatchRow] = run(request(path: "/batches?select=*&status=eq.open"))
            async let depRows: [DepartureRow] = run(request(path: "/batch_departures?select=batch_slug,departure_date,sort_order&status=eq.open&order=sort_order"))
            let (rows, deps) = try await (batchRows, depRows)

            let departuresBySlug = Dictionary(grouping: deps, by: \.batch_slug)
                .mapValues { rows in
                    rows.sorted { ($0.sort_order ?? 0) < ($1.sort_order ?? 0) }
                        .compactMap { $0.departure_date.flatMap(Self.dayFormatter.date(from:)) }
                }

            let slugOrder = ["batch-a", "batch-b", "batch-d", "batch-e", "batch-c"]
            var batches = rows
                .map { Self.mapBatch($0, departures: departuresBySlug[$0.slug] ?? []) }
                .sorted { (slugOrder.firstIndex(of: $0.id) ?? 99) < (slugOrder.firstIndex(of: $1.id) ?? 99) }

            // Mystery Edition is status 'waitlist' (filtered out above) — keep its
            // waitlist-only card so Discover matches the website's lineup.
            if !batches.contains(where: { $0.isWaitlistOnly }),
               let mystery = MockAPIClient.batches.first(where: { $0.isWaitlistOnly }) {
                batches.append(mystery)
            }

            print("[live] fetched \(rows.count) open batches + \(deps.count) departures from \(config.supabaseURL)")
            return batches
        } catch {
            // Production resilience: Discover must never render broken. Fall back
            // to the bundled catalog and log the failure.
            print("[live] fetchBatches failed (\(error)) — falling back to bundled mock batches")
            return try await mock.fetchBatches()
        }
    }

    /// Merge a live row with the bundled presentation catalog (itinerary, copy,
    /// colors live in-app; price/spots/status are the live source of truth).
    private static func mapBatch(_ row: BatchRow, departures: [Date]) -> Batch {
        let p = MockAPIClient.batches.first { $0.id == row.slug }
        return Batch(
            id: row.slug,
            slug: p?.slug ?? row.slug,
            name: row.name,
            edition: p?.edition ?? .mystery,
            tagline: p?.tagline ?? "Curated travelers. Human screening.",
            region: p?.region ?? "India",
            route: p?.route ?? "Route shared after approval",
            durationText: p?.durationText ?? "—",
            price: row.price,
            depositPercent: row.deposit_percent ?? 30,
            ageMin: p?.ageMin ?? 18,
            ageMax: p?.ageMax ?? 36,
            departures: departures.isEmpty ? (p?.departures ?? []) : departures,
            womenCount: row.spots_taken_f ?? 0,
            menCount: row.spots_taken_m ?? 0,
            womenCapacity: row.max_spots_f ?? 12,
            menCapacity: row.max_spots_m ?? 12,
            itinerary: p?.itinerary ?? [],
            highlights: p?.highlights ?? [],
            heroColorHex: p?.heroColorHex ?? 0x2E4A42,
            isWaitlistOnly: row.status == "waitlist" || row.price == nil
        )
    }

    // MARK: Feed (live; empty until the trip_photos prod migration runs)

    func fetchFeed() async throws -> [TripPhoto] {
        do {
            let rows: [TripPhotoRow] = try await run(request(path: "/trip_photos?select=*&status=in.(approved,featured)"))
            return rows.map { row in
                TripPhoto(
                    id: row.id,
                    batchId: row.batch_id ?? "",
                    batchName: MockAPIClient.batches.first { $0.id == row.batch_id }?.name ?? "Togetha batches",
                    caption: row.caption ?? "",
                    uploaderName: "Traveler",
                    isOwn: false,
                    reviewState: .approved,
                    colorHex: 0x4A6B5F,
                    aspectRatio: 1.0
                )
            }
        } catch {
            // Table lands with the mobile prod migration; empty feed is expected.
            print("[live] fetchFeed: trip_photos unavailable — showing empty state (\(error))")
            return []
        }
    }

    // MARK: Tia (edge function, mock fallback so chat never dead-ends)

    func sendTiaMessage(messages: [ChatMessage], context: TiaContext?) async throws -> ChatMessage {
        do {
            let body = try JSONEncoder().encode(
                ["messages": messages.map { ["role": $0.role.rawValue, "text": $0.text] }]
            )
            let reply: TiaReply = try await run(request(path: "/tia-chat", method: "POST", body: body, edge: true))
            guard let text = reply.reply ?? reply.text ?? reply.message else {
                throw URLError(.cannotDecodeContentData)
            }
            return ChatMessage(role: .tia, text: text)
        } catch {
            print("[live] tia-chat edge function unavailable — using local concierge (\(error))")
            return try await mock.sendTiaMessage(messages: messages, context: context)
        }
    }

    // MARK: Engagement (fire-and-forget, batched upstream, never blocks UI)

    func trackEvents(_ events: [EngagementEvent]) async throws {
        guard !events.isEmpty else { return }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let body = try? encoder.encode(["events": events]),
              let req = try? request(path: "/track-event", method: "POST", body: body, edge: true) else { return }
        // Silent failure by design — analytics must never surface errors.
        _ = try? await session.data(for: req)
    }

    // MARK: Mocked paths — funnel writes stay out of prod for now
    // TODO(auth): wire these to prod once OTP auth + edge functions ship.
    // Payments stay mocked until rzp_test_ keys exist (see PROD_SCHEMA.md) —
    // never trigger live Razorpay charges from the app.

    private struct ProfileRow: Decodable { let applicant_id: String? }
    private struct ApplicantRow: Decodable {
        let id: String
        let name: String?
        let batch_slug: String?
        let status: String?
        let kyc_status: String?
        let payment_plan: String?
        let amount_paid: Int?
        let balance_deadline_at: String?
        let created_at: String?
        let quiz_score: Int?
    }

    /// The signed-in user's real application. Resolves the applicant the website's
    /// way — profiles.applicant_id first, then email — so web and app agree.
    /// Not signed in → the mock/demo application (graceful fallback).
    func fetchApplication() async throws -> Application? {
        guard let session = AuthService.session() else {
            return try await mock.fetchApplication()
        }
        do {
            let profiles: [ProfileRow] = try await run(request(path: "/profiles?id=eq.\(session.sub)&select=applicant_id"))
            let filter: String
            if let aid = profiles.first?.applicant_id {
                filter = "id=eq.\(aid)"
            } else if let email = session.email {
                let enc = email.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)?
                    .replacingOccurrences(of: "+", with: "%2B") ?? email
                filter = "email=eq.\(enc)&order=created_at.desc&limit=1"
            } else {
                return nil
            }
            let rows: [ApplicantRow] = try await run(request(path: "/applicants?select=id,name,batch_slug,status,kyc_status,payment_plan,amount_paid,balance_deadline_at,created_at,quiz_score&\(filter)"))
            guard let row = rows.first else { return nil }   // signed in, no application yet
            return Self.mapApplication(row)
        } catch {
            print("[live] fetchApplication failed (\(error)) — showing no application")
            return nil
        }
    }

    private static func mapApplication(_ r: ApplicantRow) -> Application {
        let status = ApplicationStatus(rawValue: r.status ?? "pending") ?? .pending
        let batch = MockAPIClient.batches.first { $0.id == r.batch_slug }
        return Application(
            id: r.id,
            batchId: r.batch_slug ?? "",
            batchName: batch?.name ?? "Your Togetha batch",
            status: status,
            kycStatus: KycStatus(rawValue: r.kyc_status ?? "pending") ?? .pending,
            paymentPlan: PaymentPlan(rawValue: r.payment_plan ?? "deposit") ?? .deposit,
            appliedAt: Self.isoDate(r.created_at) ?? .now,
            departureDate: batch?.departures.first,
            balanceDueDeadline: Self.isoDate(r.balance_deadline_at),
            depositPaid: (r.amount_paid ?? 0) > 0 || [.depositPaid, .approved, .paid].contains(status),
            balancePaid: status == .paid,
            quizTaken: r.quiz_score != nil
        )
    }

    private static func isoDate(_ s: String?) -> Date? {
        guard let s else { return nil }
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f.date(from: s) ?? ISO8601DateFormatter().date(from: s)
    }

    private struct ProfRow: Decodable {
        let full_name: String?
        let display_name: String?
        let city: String?
        let is_verified: Bool?
        let applicant_id: String?
    }
    private struct ApplNameRow: Decodable { let name: String?; let gender: String? }

    func fetchProfile() async throws -> Profile {
        guard let session = AuthService.session() else { return try await mock.fetchProfile() }
        do {
            let rows: [ProfRow] = try await run(request(path: "/profiles?id=eq.\(session.sub)&select=full_name,display_name,city,is_verified,applicant_id"))
            let p = rows.first
            var name = p?.display_name ?? p?.full_name ?? ""
            var gender = "—"
            let city = p?.city ?? ""
            if name.isEmpty, let aid = p?.applicant_id {
                let a: [ApplNameRow] = try await run(request(path: "/applicants?id=eq.\(aid)&select=name,gender"))
                if name.isEmpty { name = a.first?.name ?? "" }
                switch a.first?.gender {
                case "f": gender = "Woman"
                case "m": gender = "Man"
                default: break
                }
            }
            return Profile(
                id: session.sub,
                name: name.isEmpty ? "Traveler" : name,
                city: city.isEmpty ? "—" : city,
                gender: gender,
                isVerified: p?.is_verified ?? false,
                payments: []
            )
        } catch {
            print("[live] fetchProfile failed (\(error))")
            return try await mock.fetchProfile()
        }
    }

    func fetchPayments() async throws -> [PaymentRecord] {
        guard let session = AuthService.session() else { return try await mock.fetchPayments() }
        do {
            let profs: [ProfileRow] = try await run(request(path: "/profiles?id=eq.\(session.sub)&select=applicant_id"))
            guard let aid = profs.first?.applicant_id else { return [] }
            struct PayRow: Decodable { let id: String; let payment_kind: String?; let amount_paise: Int?; let created_at: String? }
            let rows: [PayRow] = try await run(request(path: "/applicant_payments?applicant_id=eq.\(aid)&select=id,payment_kind,amount_paise,created_at&order=created_at.desc"))
            return rows.map { r in
                PaymentRecord(
                    id: r.id,
                    label: "\((r.payment_kind ?? "payment").capitalized) payment",
                    amount: (r.amount_paise ?? 0) / 100,
                    date: Self.isoDate(r.created_at) ?? .now,
                    status: "Paid"
                )
            }
        } catch {
            print("[live] fetchPayments failed (\(error))")
            return []
        }
    }

    func submitQuiz(answers: [String: String]) async throws {
        try await mock.submitQuiz(answers: answers)
    }

    func submitApplication(batchId: String, form: [String: String]) async throws -> Application {
        // Signed in → create a real PENDING applicant via the edge function
        // (service role inserts + links). Not signed in / function not deployed →
        // mock, so the demo keeps working (graceful fallback).
        guard AuthService.session() != nil, !config.functionsURL.isEmpty else {
            return try await mock.submitApplication(batchId: batchId, form: form)
        }
        do {
            struct Wrap: Decodable { let applicant: ApplicantRow? }
            var payload: [String: Any] = ["batch_slug": batchId, "payment_plan": form["payment_plan"] ?? "deposit"]
            for k in ["name", "gender", "city", "intent"] where form[k] != nil { payload[k] = form[k] }
            let body = try JSONSerialization.data(withJSONObject: payload)
            let wrap: Wrap = try await run(request(path: "/create-application", method: "POST", body: body, edge: true))
            if let row = wrap.applicant { return Self.mapApplication(row) }
            return try await mock.submitApplication(batchId: batchId, form: form)
        } catch {
            print("[live] create-application unavailable (\(error)) — mock apply")
            return try await mock.submitApplication(batchId: batchId, form: form)
        }
    }

    func createOrder(batchId: String, purpose: String) async throws -> PaymentOrder {
        try await mock.createOrder(batchId: batchId, purpose: purpose)
    }

    func joinWaitlist(batchId: String, email: String) async throws {
        try await mock.joinWaitlist(batchId: batchId, email: email)
    }

    func fetchLogistics() async throws -> DepartureLogistics? {
        // TODO(auth): call {functionsURL}/get-logistics with the signed-in JWT.
        // That edge function enforces the approved+paid gate with the service
        // role and returns the departure_logistics row. Until auth + the
        // function ship, serve bundled logistics so the screen is demoable.
        try await mock.fetchLogistics()
    }
}

// MARK: - Mock client (Phase 1 default)

struct MockAPIClient: APIClientProtocol {

    static func date(_ s: String) -> Date {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Asia/Kolkata")
        return f.date(from: s) ?? .now
    }

    // Alternating Friday departures, Aug–Sep 2026.
    static let fridaysA = [date("2026-08-07"), date("2026-08-21"), date("2026-09-04"), date("2026-09-18")]
    static let fridaysB = [date("2026-08-14"), date("2026-08-28"), date("2026-09-11"), date("2026-09-25")]

    static let himalayanItinerary: [ItineraryDay] = [
        ItineraryDay(day: 1, title: "Friday — leave for Manali", detail: "Overnight Volvo from Delhi with your batch. The trip starts on the bus, honestly."),
        ItineraryDay(day: 2, title: "Manali — settle in", detail: "Old Manali cafés, riverside walk, and the only icebreaker we'll ever make you do."),
        ItineraryDay(day: 3, title: "Manali — trails & bonfire", detail: "Jogini Falls walk in small mixed groups. Bonfire night one — it matters."),
        ItineraryDay(day: 4, title: "Kasol — Parvati valley", detail: "Drive to Kasol. Riverside afternoon, Chalal village walk, long dinner."),
        ItineraryDay(day: 5, title: "Sissu — over the Atal tunnel", detail: "Lahaul's big-sky country. Waterfall, snow points, and the quietest night of the trip."),
        ItineraryDay(day: 6, title: "Slow morning, goodbyes", detail: "Late breakfast, numbers exchanged, and the drive back down.")
    ]

    static let udaipurItinerary: [ItineraryDay] = [
        ItineraryDay(day: 1, title: "Udaipur — lake city check-in", detail: "Heritage stay near Lake Pichola. Sunset boat ride, rooftop welcome dinner."),
        ItineraryDay(day: 2, title: "Kumbhalgarh — the great wall", detail: "Day trip to the fort. Golden hour on the ramparts, storytelling on the drive back."),
        ItineraryDay(day: 3, title: "Old city, slow goodbye", detail: "City Palace morning, bazaar wander in pairs, one last lakeside brunch.")
    ]

    static let batches: [Batch] = [
        Batch(
            id: "batch-a", slug: "himalayan-genz", name: "Himalayan Love Trail — GenZ Edition",
            edition: .genZ,
            tagline: "Six days in the mountains with people your age worth meeting.",
            region: "Himachal Pradesh", route: "Manali · Kasol · Sissu", durationText: "5N/6D",
            price: 9_999, depositPercent: 30, ageMin: 18, ageMax: 25,
            departures: fridaysA,
            womenCount: 9, menCount: 7, womenCapacity: 12, menCapacity: 12,
            itinerary: himalayanItinerary,
            highlights: ["12 women · 12 men per departure", "Every traveler human-screened", "Bonfire nights built for talking", "Togetha crew on every batch"],
            heroColorHex: 0x2E4A42, isWaitlistOnly: false
        ),
        Batch(
            id: "batch-b", slug: "himalayan-millennial", name: "Himalayan Love Trail — Millennial Edition",
            edition: .millennial,
            tagline: "Same mountains, deeper conversations. Ages 26–36.",
            region: "Himachal Pradesh", route: "Manali · Kasol · Sissu", durationText: "5N/6D",
            price: 9_999, depositPercent: 30, ageMin: 26, ageMax: 36,
            departures: fridaysB,
            womenCount: 10, menCount: 8, womenCapacity: 12, menCapacity: 12,
            itinerary: himalayanItinerary,
            highlights: ["12 women · 12 men per departure", "Every traveler human-screened", "Paced for real conversation", "Togetha crew on every batch"],
            heroColorHex: 0x1F3A34, isWaitlistOnly: false
        ),
        Batch(
            id: "batch-d", slug: "udaipur-genz", name: "Udaipur Love Trail — GenZ Edition",
            edition: .genZ,
            tagline: "Lakes, forts, and rooftop dinners that run late.",
            region: "Rajasthan", route: "Udaipur · Kumbhalgarh", durationText: "2N/3D",
            price: 11_999, depositPercent: 30, ageMin: 18, ageMax: 25,
            departures: fridaysA,
            womenCount: 8, menCount: 6, womenCapacity: 12, menCapacity: 12,
            itinerary: udaipurItinerary,
            highlights: ["12 women · 12 men per departure", "Heritage stays by the lake", "Kumbhalgarh golden hour", "Every traveler human-screened"],
            heroColorHex: 0x8A5A44, isWaitlistOnly: false
        ),
        Batch(
            id: "batch-e", slug: "udaipur-millennial", name: "Udaipur Love Trail — Millennial Edition",
            edition: .millennial,
            tagline: "The romantic city, for people done with small talk.",
            region: "Rajasthan", route: "Udaipur · Kumbhalgarh", durationText: "2N/3D",
            price: 11_999, depositPercent: 30, ageMin: 26, ageMax: 36,
            departures: fridaysB,
            womenCount: 9, menCount: 8, womenCapacity: 12, menCapacity: 12,
            itinerary: udaipurItinerary,
            highlights: ["12 women · 12 men per departure", "Heritage stays by the lake", "Long rooftop dinners", "Every traveler human-screened"],
            heroColorHex: 0x9A6A50, isWaitlistOnly: false
        ),
        Batch(
            id: "batch-c", slug: "mystery-edition", name: "Mystery Edition",
            edition: .mystery,
            tagline: "Somewhere new. Someone new. That's all we're saying.",
            region: "Classified", route: "Revealed 72 hours before departure", durationText: "?N/?D",
            price: nil, depositPercent: 30, ageMin: 18, ageMax: 36,
            departures: [],
            womenCount: 0, menCount: 0, womenCapacity: 12, menCapacity: 12,
            itinerary: [],
            highlights: ["Destination revealed 72h out", "Waitlist only", "Same screening, more mystery"],
            heroColorHex: 0x3E4A54, isWaitlistOnly: true
        )
    ]

    static let feedPhotos: [TripPhoto] = [
        TripPhoto(id: "p1", batchId: "batch-a", batchName: "Himalayan Love Trail", caption: "Kasol riverside, hour three of talking", uploaderName: "Ananya", isOwn: false, reviewState: .approved, colorHex: 0x4A6B5F, aspectRatio: 0.8, imageName: "himalayan-campfire-friendships"),
        TripPhoto(id: "p2", batchId: "batch-a", batchName: "Himalayan Love Trail", caption: "Bonfire night one", uploaderName: "Rohan", isOwn: false, reviewState: .approved, colorHex: 0x2E4A42, aspectRatio: 1.2, imageName: "himalayan-dating-apps-fatigue"),
        TripPhoto(id: "p3", batchId: "batch-b", batchName: "Himalayan Love Trail", caption: "Sissu, big-sky country", uploaderName: "Meera", isOwn: false, reviewState: .approved, colorHex: 0x5C7A6E, aspectRatio: 1.0, imageName: "himalayan-matchmaking-machine"),
        TripPhoto(id: "p4", batchId: "batch-a", batchName: "Himalayan Love Trail", caption: "Sunrise from the hostel roof", uploaderName: "You", isOwn: true, reviewState: .pending, colorHex: 0x3A5A50, aspectRatio: 0.75, imageName: "himalayan-how-it-works-funnel"),
        TripPhoto(id: "p5", batchId: "batch-d", batchName: "Udaipur Love Trail", caption: "Pichola at golden hour", uploaderName: "Sana", isOwn: false, reviewState: .approved, colorHex: 0x9A6A50, aspectRatio: 0.8, imageName: "udaipur-lake-friendships"),
        TripPhoto(id: "p6", batchId: "batch-e", batchName: "Udaipur Love Trail", caption: "Rooftop dinner, night one", uploaderName: "Kabir", isOwn: false, reviewState: .approved, colorHex: 0x7A4A38, aspectRatio: 1.1, imageName: "udaipur-bollywood-house-party"),
        TripPhoto(id: "p7", batchId: "batch-d", batchName: "Udaipur Love Trail", caption: "Kumbhalgarh ramparts, all of us", uploaderName: "Priya", isOwn: false, reviewState: .approved, colorHex: 0xB08054, aspectRatio: 0.9, imageName: "udaipur-dating-apps-fatigue")
    ]

    static let profile = Profile(
        id: "u1", name: "Mrinal Raj", city: "Bengaluru", gender: "Man", isVerified: true,
        payments: []
    )

    /// Post-booking logistics for the Himalayan trip (mirrors the website's
    /// departure_logistics fields + hotel photos of the booked stays).
    static let himalayanLogistics = DepartureLogistics(
        pickupLocation: "Majnu Ka Tilla, Delhi — exact boarding point shared 24h before departure",
        reportingTime: "Fri · 9:00 PM",
        departureTime: "Fri · 10:00 PM",
        arrivalTime: "Thu · 6:00–7:00 AM",
        vehicleNumber: "HR 55 AK 2043",
        guideName: "Nikhil Rawat",
        guidePhone: "+917054183391",
        guideEmail: "trips@togetha.club",
        stays: [
            StayHotel(id: "s1", name: "The Himalayan Riverside", location: "Old Manali", nights: 3,
                      note: "Single-gender sharing rooms · riverside balcony.", imageName: "himalayan-campfire-friendships"),
            StayHotel(id: "s2", name: "Parvati Woods Camp", location: "Kasol", nights: 1,
                      note: "Alpine campsite by the river · bonfire deck.", imageName: "himalayan-dating-apps-fatigue"),
            StayHotel(id: "s3", name: "Sissu Skyview Stay", location: "Sissu · Lahaul", nights: 1,
                      note: "Big-sky mountain lodge over the Atal tunnel.", imageName: "himalayan-matchmaking-machine")
        ]
    )

    // MARK: - Community chat seed data

    static func seedGroups() -> [ChatGroup] {
        let t = date("2026-07-21")
        return [
            ChatGroup(
                id: "g-udaipur-genz-interested",
                batchId: "batch-d",
                name: "Udaipur Love Trail · GenZ · Interested",
                kind: .interested,
                messages: [
                    GroupMessage(senderName: "Sana", text: "Anyone else eyeing the Aug 21 Friday departure?", sentAt: t.addingTimeInterval(-86_000)),
                    GroupMessage(senderName: "Arjun", text: "Yes! Deposit paid yesterday, screening pending 🤞", sentAt: t.addingTimeInterval(-82_000)),
                    GroupMessage(senderName: "Togetha Crew", text: "Reminder: deposit reserves your screening slot — approvals go out within 24–36 hours.", sentAt: t.addingTimeInterval(-60_000)),
                    GroupMessage(senderName: "Priya", text: "The Kumbhalgarh sunset photos from last batch sold me honestly", sentAt: t.addingTimeInterval(-20_000))
                ],
                memberCount: 47
            )
        ]
    }

    static func travelersGroup(for batch: Batch) -> ChatGroup {
        let t = date("2026-07-21")
        return ChatGroup(
            id: "g-\(batch.id)-travelers",
            batchId: batch.id,
            name: "\(batch.name.components(separatedBy: " — ").first ?? batch.name) · \(batch.edition.label) · Travelers",
            kind: .travelers,
            messages: [
                GroupMessage(senderName: "Togetha Crew", text: "Welcome to the Travelers group! Everyone here has paid their deposit. Packing list and departure details drop here first.", sentAt: t.addingTimeInterval(-40_000)),
                GroupMessage(senderName: "Ishita", text: "So excited — first Togetha trip for me!", sentAt: t.addingTimeInterval(-30_000)),
                GroupMessage(senderName: "Kabir", text: "Second one for me. You're all in for something good.", sentAt: t.addingTimeInterval(-10_000))
            ],
            memberCount: 14
        )
    }

    static func seedQueries() -> [UserQuery] {
        [
            UserQuery(id: "q1", kind: "Query", subject: "Can I switch my departure Friday?",
                      detail: "I picked Aug 21 but Sep 4 works better now.",
                      status: .resolved, createdAt: date("2026-07-12")),
            UserQuery(id: "q2", kind: "Feedback", subject: "Loved the quiz",
                      detail: "The metaphor question is genuinely great.",
                      status: .inProgress, createdAt: date("2026-07-18"))
        ]
    }

    private static func pause(_ seconds: Double = 0.5) async {
        try? await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
    }

    func fetchBatches() async throws -> [Batch] {
        await Self.pause(0.4)
        return Self.batches
    }

    func fetchApplication() async throws -> Application? {
        await Self.pause(0.3)
        return nil // fresh user by default; AppState holds the created one
    }

    func submitQuiz(answers: [String: String]) async throws {
        await Self.pause(0.4)
    }

    func submitApplication(batchId: String, form: [String: String]) async throws -> Application {
        await Self.pause(0.6)
        let batch = Self.batches.first { $0.id == batchId }
        let departure = form["departure"].flatMap { raw in
            batch?.departures.first { "\($0.timeIntervalSince1970)" == raw }
        } ?? batch?.departures.first
        return Application(
            id: UUID().uuidString,
            batchId: batchId,
            batchName: batch?.name ?? "Togetha batch",
            status: .pending,
            kycStatus: .pending,
            paymentPlan: PaymentPlan(rawValue: form["payment_plan"] ?? "deposit") ?? .deposit,
            appliedAt: .now,
            departureDate: departure,
            balanceDueDeadline: nil,
            depositPaid: false,
            balancePaid: false
        )
    }

    func createOrder(batchId: String, purpose: String) async throws -> PaymentOrder {
        await Self.pause(0.5)
        let batch = Self.batches.first { $0.id == batchId }
        let amount: Int
        switch purpose {
        case "deposit": amount = batch?.depositAmount ?? 3_000
        case "full": amount = batch?.priceTotal ?? 9_999
        default: amount = batch?.balanceAmount ?? 0
        }
        return PaymentOrder(id: "order_\(UUID().uuidString.prefix(8))", amount: amount, currency: "INR", purpose: purpose)
    }

    func fetchFeed() async throws -> [TripPhoto] {
        await Self.pause(0.4)
        return Self.feedPhotos
    }

    func joinWaitlist(batchId: String, email: String) async throws {
        await Self.pause(0.6)
    }

    func fetchLogistics() async throws -> DepartureLogistics? {
        await Self.pause(0.4)
        return Self.himalayanLogistics
    }

    func fetchProfile() async throws -> Profile {
        await Self.pause(0.3)
        return Self.profile
    }

    func fetchPayments() async throws -> [PaymentRecord] {
        await Self.pause(0.3)
        return []
    }

    func trackEvents(_ events: [EngagementEvent]) async throws {
        for e in events {
            var parts = ["[engagement] \(e.name)", "session=\(e.sessionId.prefix(8))"]
            if let s = e.screen { parts.append("screen=\(s)") }
            if let b = e.batchId { parts.append("batch=\(b)") }
            if let d = e.dwellSeconds { parts.append("dwell=\(d)s") }
            print(parts.joined(separator: " "))
        }
    }

    // MARK: - Tia (mock tool-calling concierge)

    func sendTiaMessage(messages: [ChatMessage], context: TiaContext?) async throws -> ChatMessage {
        await Self.pause(0.9)
        let last = messages.last?.text.lowercased() ?? ""
        return ChatMessage(role: .tia, text: Self.tiaReply(to: last, context: context))
    }

    static func tiaReply(to last: String, context: TiaContext?) -> String {
        let df = DateFormatter()
        df.dateFormat = "EEE d MMM"

        // Tool: batch schedule
        if last.contains("schedule") || last.contains("departure") || last.contains("upcoming") || last.contains("dates") || last.contains("batches") || last.contains("trips") {
            let lines = batches.filter { !$0.isWaitlistOnly }.map { b in
                let next = b.departures.first.map { df.string(from: $0) } ?? "TBA"
                return "• \(b.name) — \(b.durationText), \(b.route), \(b.priceTotal.inr), \(b.ageBandText). Next Friday departure: \(next)."
            }
            return "Here's the current schedule (we run alternating Friday departures):\n\n" + lines.joined(separator: "\n") + "\n\nMystery Edition is waitlist-only for now. Want me to check your booking against any of these?"
        }

        // Tool: my bookings
        if last.contains("booking") || last.contains("my status") || last.contains("application status") || last.contains("my application") {
            guard let ctx = context, let app = ctx.application else {
                return "I checked — you don't have an active application yet. When you apply, the 30% deposit reserves your screening slot, a human reviews your profile in 24–36 hours, and once approved you get a 48-hour window to pay the balance."
            }
            var out = "Here's your booking:\n\n• \(app.batchName)\n• Status: \(app.status.label)\n• Profile: \(app.kycStatus.label)\n• Plan: \(app.paymentPlan.label)"
            if let dep = app.departureDate { out += "\n• Departure: \(df.string(from: dep))" }
            if app.status == .approved, let deadline = app.balanceDueDeadline {
                let hours = max(0, Int(deadline.timeIntervalSinceNow / 3600))
                let balance = ctx.balanceDue ?? 0
                out += "\n• Balance due: \(balance.inr) — about \(hours)h left in your 48-hour window. Miss it and the slot is released."
            } else if app.status == .depositPaid {
                out += "\n\nA human is reviewing your profile — decisions land within 24–36 hours. Nothing to do right now."
            } else if app.status == .paid {
                out += "\n\nYou're a confirmed traveler. See you at the departure point!"
            }
            return out
        }

        // Tool: my queries / feedback
        if last.contains("quer") || last.contains("feedback") || last.contains("ticket") || last.contains("complaint") {
            guard let ctx = context, !ctx.queries.isEmpty else {
                return "You haven't raised any queries or feedback yet. You can submit one from Account → My queries & feedback, or just tell me here and I'll log it."
            }
            let lines = ctx.queries.map { "• [\($0.status.label)] \($0.kind): \($0.subject)" }
            return "Your queries and feedback:\n\n" + lines.joined(separator: "\n") + "\n\nAnything you'd like to add to one of these?"
        }

        // Tool: company info / support / refunds
        if last.contains("support") || last.contains("contact") || last.contains("whatsapp") || last.contains("hours") || last.contains("refund") || last.contains("cancel") || last.contains("company") {
            return "Quick company facts:\n\n• Support hours: Monday–Saturday, 10:00 AM–7:00 PM IST\n• WhatsApp: +91 70541 83391\n• Refunds: processed in 5–7 business days\n• Cancellation fee: ₹999\n• Slot booking: 30% deposit reserves your screening slot (not a confirmed seat)\n\nAnything specific I can dig into?"
        }

        if last.contains("screen") || last.contains("approv") || last.contains("verif") {
            return "Screening is done by a real person, not an algorithm. They review your quiz, application, and the balance of the batch — it takes 24–36 hours. Once approved, you get a 48-hour window to pay the balance; if it lapses, the slot is released. I can't speed it up or promise an outcome."
        }
        if last.contains("deposit") || last.contains("pay") {
            return "The 30% deposit reserves your screening slot — it doesn't confirm a seat. A human reviews every application within 24–36 hours. If it's not a fit this time, your deposit is refunded (5–7 business days)."
        }
        if last.contains("match") {
            return "Matching happens after you're approved and your balance is paid. Our engine reads your quiz across 12 compatibility dimensions and places you where the mix genuinely works — it's about the whole group, not a swipe."
        }
        if last.contains("hi") || last.contains("hello") || last.contains("hey") {
            return "Hi! I'm Tia. I can check your booking status, list upcoming Friday departures, pull up your queries, or explain how screening works. One thing upfront: screening decisions are made by humans, so I can't promise approvals."
        }
        return "The short version of how Togetha works: you apply, a 30% deposit reserves your screening slot, a human reviews your profile in 24–36 hours, and once approved you have 48 hours to pay the balance and confirm your seat. Try the chips below — I can check your booking, the schedule, or your queries."
    }
}

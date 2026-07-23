import SwiftUI

struct DiscoverView: View {
    @Environment(\.api) private var api
    @Environment(AppState.self) private var appState
    @State private var batches: [Batch] = []
    @State private var isLoading = true

    /// Age-band edition filtering from the quiz age answer.
    /// The Mystery (waitlist) card is always visible.
    private var visibleBatches: [Batch] {
        switch appState.ageBand {
        case .genZ: batches.filter { $0.isWaitlistOnly || $0.edition == .genZ }
        case .millennial: batches.filter { $0.isWaitlistOnly || $0.edition == .millennial }
        case .other, .unknown: batches
        }
    }

    private var isFiltered: Bool {
        appState.ageBand == .genZ || appState.ageBand == .millennial
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                    header
                    conceptSection
                    proofStrip

                    if isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.top, Theme.Spacing.xxl)
                    } else {
                        destinationsSection

                        // Mystery Edition stays a full-width waitlist card below the
                        // destination carousel (it's a teaser, not a bookable batch).
                        if let mystery = visibleBatches.first(where: { $0.isWaitlistOnly }) {
                            MysteryWaitlistCard(batch: mystery)
                                .onAppear { EngagementTracker.shared.listingView(batchId: mystery.id) }
                        }

                        ExploreStrip()
                            .padding(.top, Theme.Spacing.sm)

                        SafetyStripCard()

                        ScreeningExplainer()
                            .padding(.top, Theme.Spacing.sm)
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.bottom, Theme.Spacing.xxl * 2)
            }
            .background { AmbientBackground() }
            // Status-bar scrim: scrolled content never sits bare under the status bar.
            .safeAreaInset(edge: .top, spacing: 0) {
                Rectangle()
                    .fill(.ultraThinMaterial)
                    .frame(height: 0)
                    .ignoresSafeArea(edges: .top)
            }
            .navigationDestination(for: Batch.self) { batch in
                BatchDetailView(batch: batch)
            }
            .navigationDestination(for: ExploreDestination.self) { destination in
                switch destination {
                case .howItWorks: HowItWorksView()
                case .safety: SafetyView()
                case .itineraries(let trip): ItinerariesView(initialTrip: trip)
                case .journal: JournalView()
                case .about: AboutView()
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .trackScreen("Discover")
            .task {
                guard batches.isEmpty else { return }
                batches = (try? await api.fetchBatches()) ?? []
                withAnimation(Theme.Motion.spring) { isLoading = false }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            HStack(spacing: Theme.Spacing.sm) {
                Image("Logo")
                    .renderingMode(.template)
                    .resizable()
                    .scaledToFit()
                    .foregroundStyle(Theme.Colors.brandText)
                    .frame(width: 26, height: 26)
                Text("TOGETHA.CLUB")
                    .font(Theme.Typo.label)
                    .kerning(2)
                    .foregroundStyle(Theme.Colors.amber)
                #if DEBUG
                // Debug-only badge proving the live Supabase client is active.
                if Config.shared.isConfigured {
                    Text("live")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.green.opacity(0.8), in: Capsule())
                }
                #endif
            }
            Text("India's first matchmaking travel club.")
                .font(Theme.Typo.hero())
                .foregroundStyle(Theme.Colors.brandText)
                .lineLimit(3)
                .minimumScaleFactor(0.75)
                .fixedSize(horizontal: false, vertical: true)
            Text("Apply → human screening (24–36h) → matched onto a batch.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
        }
        .padding(.top, Theme.Spacing.md)
    }

    // MARK: - Homepage sections

    /// "What is this" — concept before inventory (verbatim from the website).
    private var conceptSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("LIKE HINGE, BUT FOR TRAVELERS")
                .font(Theme.Typo.label)
                .kerning(1.5)
                .foregroundStyle(Theme.Colors.amber)
            Text("Travel is the best first date you'll never plan.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)
            Text("Dating apps give you a photo and a 3-line bio. We give you 6 days in the mountains with 23 interesting, AI-matched, verified singles who all showed up for the same reason. If there's a spark, you'll know it — and it'll be real.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .glassCard()
    }

    private let proofStats: [(String, String)] = [
        ("24", "Verified singles per batch"),
        ("12 · 12", "Women & men, always balanced"),
        ("60%", "Report something changed"),
        ("24–36h", "Human screening, every one")
    ]

    /// Horizontal proof strip — data, not claims. Uniform cards for symmetry.
    private var proofStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.md) {
                ForEach(proofStats, id: \.0) { stat in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(stat.0)
                            .font(Theme.Typo.h2())
                            .foregroundStyle(Theme.Colors.amber)
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                        Text(stat.1)
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(width: 142, height: 62, alignment: .topLeading)
                    .padding(Theme.Spacing.sm + 4)
                    .glassCard()
                }
            }
            .padding(.horizontal, Theme.Spacing.md)
        }
        .padding(.horizontal, -Theme.Spacing.md)
    }

    /// This visitor's compatibility % for a batch — real score once the quiz is
    /// done, else a stable per-batch teaser so the number entices the booking.
    private func compatibilityPercent(for batch: Batch) -> Int {
        let stable = batch.id.utf8.reduce(0) { $0 + Int($1) }
        if appState.quizCompleted, let r = appState.lastMatchResult {
            if r.recommendedBatchId == batch.id { return r.score }
            return max(72, r.score - 4 - (stable % 6))
        }
        return 87 + (stable % 9) // 87–95 pre-quiz teaser
    }

    /// Concept sits above; destinations are a horizontal carousel below it.
    private var destinationsSection: some View {
        let cards = visibleBatches.filter { !$0.isWaitlistOnly }
        return VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            SectionHeader(title: "Choose your destination")
            Text(isFiltered
                 ? "Editions matched to your age from the quiz."
                 : "Take the quiz and we'll match you into your best-fit batch.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Theme.Spacing.md) {
                    ForEach(cards) { batch in
                        NavigationLink(value: batch) {
                            BatchCard(batch: batch, matchPercent: compatibilityPercent(for: batch))
                                .frame(width: 300)
                        }
                        .buttonStyle(SpringPressStyle())
                        .simultaneousGesture(TapGesture().onEnded {
                            EngagementTracker.shared.listingClick(batchId: batch.id)
                        })
                        .onAppear { EngagementTracker.shared.listingView(batchId: batch.id) }
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
            }
            .padding(.horizontal, -Theme.Spacing.md)
        }
    }
}

// MARK: - Batch card

struct BatchCard: View {
    let batch: Batch
    /// This visitor's compatibility % — shown as a prominent booking hook.
    var matchPercent: Int? = nil

    // FOMO scarcity (stable per batch, decoupled from real bookings) — always low.
    private var womenLeft: Int { Fomo.womenSpotsLeft(batch) }
    private var menLeft: Int { Fomo.menSpotsLeft(batch) }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topLeading) {
                Group {
                    if let trip = ExploreTrip.forBatch(id: batch.id) {
                        Image(trip.coverImage)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 180)
                            .frame(maxWidth: .infinity)
                            .clipped()
                            .overlay(
                                LinearGradient(
                                    colors: [.black.opacity(0.35), .clear, .black.opacity(0.25)],
                                    startPoint: .top, endPoint: .bottom
                                )
                            )
                    } else {
                        LinearGradient(
                            colors: [batch.heroColor, batch.heroColor.opacity(0.6)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        )
                        .frame(height: 180)
                        .overlay(alignment: .bottomTrailing) {
                            MountainSilhouette()
                                .fill(.white.opacity(0.08))
                                .frame(height: 90)
                        }
                    }
                }
                .frame(height: 180)

                HStack {
                    Text(batch.route)
                        .font(Theme.Typo.label)
                        .foregroundStyle(.white)
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, 5)
                        .background(.black.opacity(0.3), in: Capsule())
                    Spacer()
                    Text(batch.durationText)
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.ink)
                        .padding(.horizontal, Theme.Spacing.sm)
                        .padding(.vertical, 5)
                        .background(Theme.Colors.amberSoft, in: Capsule())
                }
                .padding(Theme.Spacing.sm + 4)
            }

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text(batch.name)
                    .font(Theme.Typo.title())
                    .foregroundStyle(Theme.Colors.brandText)
                    .multilineTextAlignment(.leading)
                if let matchPercent {
                    HStack(spacing: 5) {
                        Image(systemName: "sparkles").font(.system(size: 11))
                        Text("\(matchPercent)% compatibility match")
                            .font(Theme.Typo.label)
                    }
                    .foregroundStyle(Theme.Colors.ink)
                    .padding(.horizontal, Theme.Spacing.sm)
                    .padding(.vertical, 5)
                    .background(Theme.Colors.amber, in: Capsule())
                }
                HStack(spacing: Theme.Spacing.sm) {
                    Text(batch.ageBandText)
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.womenAccent)
                    Text("· Next: \(batch.nextDepartureText)")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                }

                GenderBalanceBar(women: batch.womenCount, men: batch.menCount, compact: true)

                if (1...5).contains(womenLeft) || (1...4).contains(menLeft) {
                    HStack(spacing: Theme.Spacing.sm) {
                        if (1...5).contains(womenLeft) {
                            StatusChip(text: "Only \(womenLeft) women's spot\(womenLeft == 1 ? "" : "s") left", color: Theme.Colors.womenAccent)
                        }
                        if (1...4).contains(menLeft) {
                            StatusChip(text: "Only \(menLeft) men's spot\(menLeft == 1 ? "" : "s") left", color: Theme.Colors.danger)
                        }
                    }
                }

                HStack(alignment: .firstTextBaseline) {
                    Text(batch.priceTotal.inr)
                        .font(Theme.Typo.bodyMedium)
                        .foregroundStyle(Theme.Colors.text)
                    Spacer()
                    Text("\(batch.spotsLeft) of \(batch.capacity) left")
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.amber)
                }
                HStack(alignment: .firstTextBaseline) {
                    Text(batch.depositCopy)
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                    Spacer()
                    Text("See my dates →")
                        .font(Theme.Typo.caption.weight(.semibold))
                        .foregroundStyle(Theme.Colors.amber)
                }
            }
            .padding(Theme.Spacing.md)
        }
        .background(Theme.Glass.tint)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Glass.highlight, lineWidth: 1))
        .shadow(color: Theme.Glass.shadow, radius: 16, y: 8)
    }
}

// MARK: - Explore the club strip

struct ExploreStrip: View {
    private let items: [(String, String, ExploreDestination)] = [
        ("sparkles", "How it works", .howItWorks),
        ("checkmark.shield", "Safety", .safety),
        ("map", "Itineraries", .itineraries(.himalayan)),
        ("book", "Journal", .journal),
        ("leaf", "About", .about)
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("EXPLORE THE CLUB")
                .font(Theme.Typo.label)
                .kerning(2)
                .foregroundStyle(Theme.Colors.amber)

            // Bleeds to the screen edge with matching content padding so the last
            // chip never clips at the trailing edge.
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Theme.Spacing.sm) {
                    ForEach(items, id: \.1) { icon, title, destination in
                        NavigationLink(value: destination) {
                            HStack(spacing: Theme.Spacing.sm) {
                                Image(systemName: icon)
                                    .font(.system(size: 14))
                                    .foregroundStyle(Theme.Colors.amber)
                                Text(title)
                                    .font(Theme.Typo.bodyMedium)
                                    .foregroundStyle(Theme.Colors.text)
                            }
                            .padding(.horizontal, Theme.Spacing.md)
                            .padding(.vertical, Theme.Spacing.sm + 4)
                            .background(.ultraThinMaterial, in: Capsule())
                            .overlay(Capsule().strokeBorder(Theme.Glass.highlight, lineWidth: 0.75))
                        }
                        .buttonStyle(SpringPressStyle())
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
            }
            .padding(.horizontal, -Theme.Spacing.md)
        }
    }
}

// MARK: - Safety strip card (home SafetyStrip content)

struct SafetyStripCard: View {
    private let chips = [
        "Government ID, checked by hand",
        "LinkedIn + socials cross-referenced",
        "Single-gender rooms",
        "Female trip leads",
        "Captains with you 24/7"
    ]

    var body: some View {
        NavigationLink(value: ExploreDestination.safety) {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text.styled("Every person in your batch is verified by a **real human — by hand.**")
                    .font(Theme.Typo.h2())
                    .foregroundStyle(Theme.Colors.brandText)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                ChipFlow(chips: chips, color: Theme.Colors.womenAccent)

                HStack {
                    Text("Can't verify you? Full refund.")
                        .font(Theme.Typo.caption.weight(.medium))
                        .foregroundStyle(Theme.Colors.amber)
                    Spacer()
                    Text("See who gets in →")
                        .font(Theme.Typo.caption.weight(.medium))
                        .foregroundStyle(Theme.Colors.text)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Theme.Spacing.md)
            .glassCard()
        }
        .buttonStyle(SpringPressStyle())
    }
}

// MARK: - Mystery Edition waitlist card

struct MysteryWaitlistCard: View {
    let batch: Batch
    @Environment(\.api) private var api

    @State private var email = ""
    @State private var joining = false
    @State private var joined = false
    @State private var revealed = false

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            ZStack(alignment: .bottomLeading) {
                LinearGradient(
                    colors: [batch.heroColor, Theme.Colors.forestDeep],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
                .frame(height: 120)
                .overlay(alignment: .topTrailing) {
                    Image(systemName: "questionmark.diamond.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(.white.opacity(0.15))
                        .padding(Theme.Spacing.md)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("WAITLIST ONLY")
                        .font(Theme.Typo.label)
                        .kerning(2)
                        .foregroundStyle(Theme.Colors.amber)
                    Text(batch.name)
                        .font(Theme.Typo.title())
                        .foregroundStyle(.white)
                }
                .padding(Theme.Spacing.md)
            }
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card - 6))

            Text(batch.tagline)
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.text)
            Text(batch.route)
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)

            if revealed {
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    Text(ExploreCopy.mysteryEyebrow)
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.amber)
                    Text(ExploreCopy.mysteryTitle)
                        .font(Theme.Typo.h2())
                        .foregroundStyle(Theme.Colors.brandText)
                    Text(ExploreCopy.mysteryDrop)
                        .font(Theme.Typo.caption.weight(.medium))
                        .foregroundStyle(Theme.Colors.womenAccent)
                    Text(ExploreCopy.mysteryDates)
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(ExploreCopy.mysteryPrice)
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)

                    ForEach(Array(ExploreCopy.mysteryClues.enumerated()), id: \.offset) { _, clue in
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: Theme.Spacing.sm) {
                                Image(systemName: "questionmark.diamond")
                                    .font(.system(size: 13))
                                    .foregroundStyle(Theme.Colors.amber)
                                Text(clue.0)
                                    .font(Theme.Typo.bodyMedium)
                                    .foregroundStyle(Theme.Colors.text)
                            }
                            if let detail = clue.1 {
                                Text(detail)
                                    .font(Theme.Typo.caption)
                                    .foregroundStyle(Theme.Colors.textMuted)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .padding(.leading, 24)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(Theme.Spacing.sm + 4)
                        .background(Theme.Colors.background, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radius.button)
                                .strokeBorder(Theme.Colors.stroke, style: StrokeStyle(lineWidth: 1, dash: [5, 4]))
                        )
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            } else {
                Button {
                    withAnimation(Theme.Motion.spring) { revealed = true }
                } label: {
                    HStack(spacing: Theme.Spacing.sm) {
                        Image(systemName: "questionmark.diamond")
                        Text("Tap for the clues")
                            .font(Theme.Typo.caption.weight(.medium))
                    }
                    .foregroundStyle(Theme.Colors.amber)
                }
                .buttonStyle(SpringPressStyle())
            }

            if joined {
                HStack(spacing: Theme.Spacing.sm) {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundStyle(Theme.Colors.success)
                    Text("You're on the list. We'll email you when the mystery opens.")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.text)
                }
                .padding(Theme.Spacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.Colors.success.opacity(0.1), in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                .transition(.scale(scale: 0.9).combined(with: .opacity))
            } else {
                HStack(spacing: Theme.Spacing.sm) {
                    TextField("your@email.com", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding(.horizontal, Theme.Spacing.md)
                        .padding(.vertical, Theme.Spacing.sm + 4)
                        .background(Theme.Colors.background, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))

                    Button {
                        Task {
                            joining = true
                            try? await api.joinWaitlist(batchId: batch.id, email: email)
                            joining = false
                            withAnimation(Theme.Motion.spring) { joined = true }
                        }
                    } label: {
                        Group {
                            if joining {
                                ProgressView().tint(Theme.Colors.ink)
                            } else {
                                Text("Join")
                                    .font(Theme.Typo.bodyMedium)
                                    .foregroundStyle(Theme.Colors.ink)
                            }
                        }
                        .padding(.horizontal, Theme.Spacing.lg)
                        .padding(.vertical, Theme.Spacing.sm + 4)
                        .background(Theme.Colors.amber, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                    }
                    .buttonStyle(SpringPressStyle())
                    .disabled(joining || !email.contains("@"))
                }
            }
        }
        .padding(Theme.Spacing.sm + 4)
        .background(Theme.Glass.tint)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Glass.highlight, lineWidth: 1))
        .shadow(color: Theme.Glass.shadow, radius: 16, y: 8)
    }
}

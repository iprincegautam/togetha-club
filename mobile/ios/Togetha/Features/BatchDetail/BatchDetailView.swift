import SwiftUI

struct BatchDetailView: View {
    let batch: Batch
    @Environment(AppState.self) private var appState
    @State private var showQuiz = false
    @State private var showApply = false
    @State private var viewersNow = Fomo.viewersNow()

    private var departureFormatter: DateFormatter {
        let f = DateFormatter()
        f.dateFormat = "EEE d MMM yyyy"
        return f
    }

    var body: some View {
        ZStack {
            AmbientBackground()
            ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                hero

                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    urgencyStrip
                    balanceSection
                    cohortTeaserSection
                    if let trip {
                        PhotoGalleryCarousel(images: trip.gallery, height: 220)
                    }
                    departuresSection
                    itinerarySection
                    if let trip {
                        itineraryLink(trip: trip)
                    }
                    vibeSection
                    reviewsSection
                    includesSection
                    policiesSection
                    pricingSection
                    trustSection
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.bottom, 120)
            }
            }
            .ignoresSafeArea(edges: .top)
        }
        .hidesTiaButton()
        .trackScreen("BatchDetail:\(batch.id)")
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: Theme.Spacing.xs) {
                if appState.quizCompleted {
                    PrimaryButton(title: "Reserve my screening slot") {
                        EngagementTracker.shared.applyStart(batchId: batch.id)
                        showApply = true
                    }
                    Text("30% now reserves your screening slot · rest after you're approved")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                } else {
                    PrimaryButton(title: "Check my fit", systemImage: "arrow.right") {
                        EngagementTracker.shared.quizStart(batchId: batch.id)
                        showQuiz = true
                    }
                }
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.sm)
            .background(.ultraThinMaterial)
        }
        .fullScreenCover(isPresented: $showQuiz) {
            // Same 13-question quiz — prefilled if answers exist (editing mode).
            QuizView(batch: batch, initialAnswers: appState.quizAnswers)
        }
        .fullScreenCover(isPresented: $showApply) {
            ApplyView(batch: batch, onDone: { showApply = false })
        }
    }

    private var trip: ExploreTrip? { ExploreTrip.forBatch(id: batch.id) }

    private var hero: some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if let trip {
                    // Color.clear takes the proposed (screen) width; the image
                    // fills it as an overlay and is clipped. This decouples the
                    // hero's layout width from the image's large intrinsic size —
                    // without it, scaledToFill pushes the whole ScrollView wider
                    // than the screen and every row clips on both edges.
                    Color.clear
                        .frame(maxWidth: .infinity)
                        .frame(height: 360)
                        .overlay {
                            Image(trip.coverImage)
                                .resizable()
                                .scaledToFill()
                        }
                        .clipped()
                        .overlay(
                            LinearGradient(
                                colors: [.black.opacity(0.3), .clear, .black.opacity(0.75)],
                                startPoint: .top, endPoint: .bottom
                            )
                        )
                } else {
                    LinearGradient(
                        colors: [batch.heroColor, batch.heroColor.opacity(0.55), Theme.Colors.forestDeep],
                        startPoint: .top, endPoint: .bottom
                    )
                    .overlay(alignment: .bottom) {
                        MountainSilhouette()
                            .fill(.white.opacity(0.06))
                            .frame(height: 140)
                    }
                }
            }
            .frame(height: 360)

            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("\(batch.route.uppercased()) · \(batch.durationText)")
                    .font(Theme.Typo.label)
                    .kerning(1.5)
                    .foregroundStyle(Theme.Colors.amber)
                Text(batch.name)
                    .font(Theme.Typo.hero())
                    .foregroundStyle(.white)
                    .lineLimit(3)
                    .minimumScaleFactor(0.75)
                    .fixedSize(horizontal: false, vertical: true)
                Text(batch.tagline)
                    .font(Theme.Typo.body)
                    .foregroundStyle(.white.opacity(0.85))
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: Theme.Spacing.sm) {
                    StatusChip(text: batch.ageBandText, color: Theme.Colors.amberSoft)
                    StatusChip(text: "12 women · 12 men", color: Theme.Colors.womenAccent)
                }
            }
            .padding(Theme.Spacing.md)
        }
    }

    // Blurred pseudo-cohort — readable professions, hidden identities. Mirrors
    // the website's CohortTeaserPanel: curiosity device that pulls toward booking.
    private let cohortPeople: [(String, String, UInt32)] = [
        ("Architect", "Bengaluru", 0x2E4A42),
        ("Founder", "Mumbai", 0x8A5A44),
        ("Doctor", "New Delhi", 0x4A6B5F),
        ("Product Designer", "Pune", 0x9A6A50),
        ("Software Engineer", "Hyderabad", 0x3E4A54),
        ("Lawyer", "Gurugram", 0x7A4A38),
        ("Chartered Accountant", "Ahmedabad", 0x445A6B),
        ("Journalist", "Kolkata", 0x6B4A5A),
        ("Marketing Lead", "Chennai", 0x5A6B4A),
        ("Dentist", "Jaipur", 0x7A5A44),
        ("Data Scientist", "Noida", 0x2E4A52),
        ("Entrepreneur", "Goa", 0x8A6A4A)
    ]

    /// Live-viewer + scarcity urgency (FOMO numbers, decoupled from real data).
    private var urgencyStrip: some View {
        let w = Fomo.womenSpotsLeft(batch)
        let m = Fomo.menSpotsLeft(batch)
        return HStack(spacing: Theme.Spacing.sm) {
            HStack(spacing: 5) {
                Image(systemName: "eye.fill").font(.system(size: 11))
                Text("\(viewersNow) viewing now")
            }
            .foregroundStyle(Theme.Colors.womenAccent)
            Spacer()
            HStack(spacing: 5) {
                Image(systemName: "flame.fill").font(.system(size: 11))
                Text("\(w) \(w == 1 ? "woman" : "women") · \(m) \(m == 1 ? "man" : "men") left")
            }
            .foregroundStyle(Theme.Colors.danger)
        }
        .font(Theme.Typo.label)
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.vertical, Theme.Spacing.sm + 2)
        .glassCard()
    }

    private var cohortTeaserSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("✦ PEOPLE ALREADY IN YOUR LANE")
                .font(Theme.Typo.label)
                .kerning(1.5)
                .foregroundStyle(Theme.Colors.amber)
            Text("\(Fomo.booked(batch)) people like you already booked this batch.")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)
            Text("Screened and verified, same vibe as you. Identities stay hidden until departure day.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Theme.Spacing.md) {
                    ForEach(cohortPeople, id: \.0) { role, city, color in
                        VStack(spacing: Theme.Spacing.xs) {
                            ZStack {
                                Circle()
                                    .fill(Color(hex: color))
                                    .frame(width: 62, height: 62)
                                    .blur(radius: 5)
                                Image(systemName: "person.fill")
                                    .font(.system(size: 24))
                                    .foregroundStyle(.white.opacity(0.55))
                                    .blur(radius: 2)
                                Image(systemName: "lock.fill")
                                    .font(.system(size: 10))
                                    .foregroundStyle(.white)
                                    .padding(5)
                                    .background(Theme.Colors.forest, in: Circle())
                                    .offset(x: 22, y: 22)
                            }
                            Text(role)
                                .font(Theme.Typo.label)
                                .foregroundStyle(Theme.Colors.text)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                            Text(city)
                                .font(.system(size: 9))
                                .foregroundStyle(Theme.Colors.textMuted)
                        }
                        .frame(width: 92)
                    }
                }
                .padding(.vertical, Theme.Spacing.xs)
            }

            Text("+ more profiles like yours on this batch — unlock after you book.")
                .font(Theme.Typo.caption.weight(.medium))
                .foregroundStyle(Theme.Colors.womenAccent)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .glassCard()
    }

    private var balanceSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            GenderBalanceBar(women: batch.womenCount, men: batch.menCount)
            HStack {
                VerifiedBadge()
                Spacer()
                Text("\(batch.spotsLeft) of \(batch.capacity) spots left")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
    }

    private var departuresSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            SectionHeader(title: "Friday departures")
            Text("Alternating Fridays — pick yours in the quiz. Per-gender capacity: 12 women, 12 men per departure.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: Theme.Spacing.sm) {
                    ForEach(batch.departures, id: \.self) { date in
                        VStack(spacing: 2) {
                            Text(date.formatted(.dateTime.weekday(.abbreviated)))
                                .font(Theme.Typo.label)
                                .foregroundStyle(Theme.Colors.amber)
                            Text(date.formatted(.dateTime.day().month(.abbreviated)))
                                .font(Theme.Typo.bodyMedium)
                                .foregroundStyle(Theme.Colors.text)
                            Text(date.formatted(.dateTime.year()))
                                .font(Theme.Typo.label)
                                .foregroundStyle(Theme.Colors.textMuted)
                        }
                        .padding(.horizontal, Theme.Spacing.md)
                        .padding(.vertical, Theme.Spacing.sm + 4)
                        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
                    }
                }
            }
        }
    }

    private var itinerarySection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "The days")
            ForEach(batch.itinerary) { day in
                HStack(alignment: .top, spacing: Theme.Spacing.md) {
                    Text("\(day.day)")
                        .font(Theme.Typo.h2())
                        .foregroundStyle(Theme.Colors.amber)
                        .frame(width: 28, alignment: .center)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(day.title)
                            .font(Theme.Typo.bodyMedium)
                            .foregroundStyle(Theme.Colors.text)
                        Text(day.detail)
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
    }

    private func itineraryLink(trip: ExploreTrip) -> some View {
        NavigationLink(value: ExploreDestination.itineraries(trip)) {
            HStack {
                Image(systemName: "map")
                    .foregroundStyle(Theme.Colors.amber)
                Text("Full day-by-day itinerary →")
                    .font(Theme.Typo.bodyMedium)
                    .foregroundStyle(Theme.Colors.text)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.Colors.textMuted)
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
        }
        .buttonStyle(SpringPressStyle())
    }

    @ViewBuilder
    private var vibeSection: some View {
        if let vibe = ExploreCopy.vibe(forBatch: batch.id) {
            CollapsibleSection(title: vibe.label, subtitle: vibe.heading) {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    ForEach(vibe.intro, id: \.self) { paragraph in
                        Text(paragraph)
                            .font(Theme.Typo.body)
                            .foregroundStyle(Theme.Colors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    ForEach(vibe.cards) { card in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(card.title)
                                .font(Theme.Typo.bodyMedium)
                                .foregroundStyle(Theme.Colors.amber)
                            if let body = card.body {
                                Text(body)
                                    .font(Theme.Typo.caption)
                                    .foregroundStyle(Theme.Colors.textMuted)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var reviewsSection: some View {
        if trip != nil {
            CollapsibleSection(title: "✦ Real stories ✦", subtitle: "Hear it from them") {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    Text("Swipe through video postcards from past travellers.")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: Theme.Spacing.sm) {
                            ForEach(ExploreCopy.videoTestimonials, id: \.poster) { person in
                                ZStack(alignment: .bottomLeading) {
                                    Image(person.poster)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 150, height: 210)
                                        .clipped()
                                    LinearGradient(
                                        colors: [.clear, .black.opacity(0.75)],
                                        startPoint: .center, endPoint: .bottom
                                    )
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(person.name)
                                            .font(Theme.Typo.bodyMedium)
                                            .foregroundStyle(.white)
                                        Text(person.role)
                                            .font(Theme.Typo.label)
                                            .foregroundStyle(.white.opacity(0.8))
                                            .fixedSize(horizontal: false, vertical: true)
                                    }
                                    .padding(Theme.Spacing.sm + 4)
                                }
                                .frame(width: 150, height: 210)
                                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.button))
                            }
                        }
                    }

                    if trip == .himalayan {
                        ForEach(ExploreCopy.himalayanReviews) { review in
                            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                                Text("\u{201C}\(review.quote)\u{201D}")
                                    .font(.system(size: 15, design: .serif).italic())
                                    .foregroundStyle(Theme.Colors.text)
                                    .fixedSize(horizontal: false, vertical: true)
                                Text("— \(review.byline)")
                                    .font(Theme.Typo.label)
                                    .foregroundStyle(Theme.Colors.amber)
                            }
                            .padding(Theme.Spacing.md)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Theme.Colors.background, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var includesSection: some View {
        if let includes = ExploreCopy.includes(forBatch: batch.id) {
            CollapsibleSection(title: includes.heading, subtitle: includes.sub) {
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    ForEach(includes.items, id: \.self) { item in
                        HStack(spacing: Theme.Spacing.sm) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 14))
                                .foregroundStyle(Theme.Colors.success)
                            Text(item)
                                .font(Theme.Typo.body)
                                .foregroundStyle(Theme.Colors.text)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var policiesSection: some View {
        if trip != nil {
            CollapsibleSection(title: "The fine print", subtitle: "Clear, fair, no surprises.") {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    ForEach(ExploreCopy.policies, id: \.0) { title, detail in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(title)
                                .font(Theme.Typo.bodyMedium)
                                .foregroundStyle(Theme.Colors.text)
                            Text(detail)
                                .font(Theme.Typo.caption)
                                .foregroundStyle(Theme.Colors.textMuted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
    }

    private var pricingSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            SectionHeader(title: "What it costs")
            VStack(spacing: Theme.Spacing.sm) {
                priceRow("Deposit (30%) — reserves your screening slot", batch.depositAmount.inr)
                priceRow("Balance — within 48h of approval", batch.balanceAmount.inr)
                Divider()
                priceRow("Total", batch.priceTotal.inr, bold: true)
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))

            Text(batch.depositCopy)
                .font(Theme.Typo.caption.weight(.medium))
                .foregroundStyle(Theme.Colors.amber)

            Text("The deposit reserves your screening slot — it doesn't confirm a seat. A human reviews every application in 24–36 hours. Once approved, you have 48 hours to pay the balance; miss the window and the slot is released.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func priceRow(_ label: String, _ value: String, bold: Bool = false) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .font(bold ? Theme.Typo.bodyMedium : Theme.Typo.caption)
                .foregroundStyle(bold ? Theme.Colors.text : Theme.Colors.textMuted)
            Spacer()
            Text(value)
                .font(bold ? Theme.Typo.bodyMedium : Theme.Typo.body)
                .foregroundStyle(Theme.Colors.text)
        }
    }

    private var trustSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            SectionHeader(title: "Why it feels safe")
            ForEach(trustPoints, id: \.0) { icon, title, detail in
                HStack(alignment: .top, spacing: Theme.Spacing.md) {
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(Theme.Colors.womenAccent)
                        .frame(width: 28)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title).font(Theme.Typo.bodyMedium).foregroundStyle(Theme.Colors.text)
                        Text(detail)
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            ScreeningExplainer()
        }
    }

    private var trustPoints: [(String, String, String)] {
        [
            ("person.badge.shield.checkmark", "Human screening", "Every traveler on this batch was individually reviewed — no exceptions."),
            ("figure.2", "Balanced by design", "12 women and 12 men per departure — the split above is live."),
            ("mappin.and.ellipse", "Crew on every trip", "A Togetha host and a local lead travel with the batch, start to finish."),
            ("hand.raised", "Zero-tolerance conduct policy", "One report of harassment ends a trip for that person, not for you.")
        ]
    }
}

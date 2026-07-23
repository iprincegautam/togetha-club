import SwiftUI

struct JourneyView: View {
    @Environment(AppState.self) private var appState
    @State private var showBalanceSheet = false
    @State private var showKyc = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    Text("Your journey")
                        .font(Theme.Typo.hero())
                        .foregroundStyle(Theme.Colors.brandText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                        .padding(.top, Theme.Spacing.md)

                    if let app = appState.application {
                        timeline(for: app)
                    } else {
                        emptyState
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.bottom, Theme.Spacing.xxl * 2)
            }
            .background { AmbientBackground() }
            .toolbar(.hidden, for: .navigationBar)
            .trackScreen("Journey")
            .sheet(isPresented: $showKyc) {
                KycView()
                    .presentationDetents([.large])
                    .presentationCornerRadius(Theme.Radius.sheet)
            }
        }
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text("Here's how your journey works")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.text)
            Text("Apply for a batch and you'll follow every step here — from your quiz to your official Togetha invitation.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            // Preview the whole flow so visitors see the road ahead (all upcoming).
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(steps.enumerated()), id: \.offset) { i, step in
                    timelineRow(title: step.title, detail: step.detail,
                                state: .upcoming, isLast: i == steps.count - 1)
                }
            }
            .padding(.vertical, Theme.Spacing.xs)

            ScreeningExplainer()
        }
    }

    // MARK: - Timeline

    private struct Step {
        let title: String
        let detail: String
    }

    private let steps: [Step] = [
        Step(title: "Quiz done", detail: "Your compatibility profile is in."),
        Step(title: "Slot reserved", detail: "Your 30% deposit reserved a screening slot — not a seat yet."),
        Step(title: "Profile in review (24–36h)", detail: "A real person is reviewing your profile and the balance of the batch."),
        Step(title: "Approved", detail: "You're in. A 48-hour window opens to complete your payment."),
        Step(title: "Payment complete", detail: "Your seat is locked and your batch is set."),
        Step(title: "Claim your Togetha invitation", detail: "Your official invitation, itinerary, and travel group unlock.")
    ]

    private func currentIndex(_ app: Application) -> Int {
        switch app.status {
        case .pending: 1
        case .depositPaid: 2
        case .approved: 4
        case .paid: 6
        case .rejected, .expired: 2
        }
    }

    @ViewBuilder
    private func timeline(for app: Application) -> some View {
        let current = currentIndex(app)
        let isTerminalFailure = app.status == .rejected || app.status == .expired

        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            HStack {
                Text(app.batchName)
                    .font(Theme.Typo.h2())
                    .foregroundStyle(Theme.Colors.text)
                Spacer()
                StatusChip(text: app.status.label, color: chipColor(app.status))
            }
            Text("Applied \(app.appliedAt.formatted(date: .abbreviated, time: .omitted))"
                 + (app.departureDate.map { " · Departs \($0.formatted(date: .abbreviated, time: .omitted))" } ?? ""))
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
        }

        let visibleSteps = isTerminalFailure ? Array(steps.prefix(4)) : steps
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(visibleSteps.enumerated()), id: \.offset) { i, step in
                let overridden = isTerminalFailure && i == 3
                timelineRow(
                    title: overridden ? terminalTitle(app.status) : step.title,
                    detail: overridden ? terminalDetail(app.status) : step.detail,
                    state: overridden ? .failed : (i < current ? .done : (i == current ? .current : .upcoming)),
                    isLast: i == visibleSteps.count - 1
                )
            }
        }

        if app.status == .depositPaid {
            kycCard(app)
            demoReviewCard
        }

        if app.status == .approved {
            balanceCard(app)
        }

        if app.status == .paid {
            invitationBox(app)
        }

        // Trip logistics unlock at approval (guide contact is a privacy gate).
        if app.status == .approved || app.status == .paid {
            logisticsLink
        }
    }

    /// The celebratory end of the flow — the official invitation reveal.
    private func invitationBox(_ app: Application) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("✦ YOUR OFFICIAL INVITATION")
                .font(Theme.Typo.label)
                .kerning(1.5)
                .foregroundStyle(Theme.Colors.amber)
            Text("You're invited to \(app.batchName).")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)
            if let dep = app.departureDate {
                Label(dep.formatted(date: .complete, time: .omitted), systemImage: "calendar")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.text)
            }
            Text("Your itinerary, trip logistics, and Travelers group are all unlocked. See you on the bus.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: "party.popper.fill")
                    .foregroundStyle(Theme.Colors.amber)
                Text("Welcome to Togetha.")
                    .font(Theme.Typo.bodyMedium)
                    .foregroundStyle(Theme.Colors.success)
            }
            .padding(.top, Theme.Spacing.xs)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.lg)
        .glassCard(stroke: Theme.Colors.amber)
    }

    private var logisticsLink: some View {
        NavigationLink {
            LogisticsView()
        } label: {
            HStack(spacing: Theme.Spacing.md) {
                Image(systemName: "map.circle.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(Theme.Colors.amber)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Trip logistics")
                        .font(Theme.Typo.bodyMedium)
                        .foregroundStyle(Theme.Colors.text)
                    Text("Pickup point, vehicle, your guide & where you'll stay")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.Colors.textMuted)
            }
            .padding(Theme.Spacing.md)
            .glassCard()
        }
        .buttonStyle(SpringPressStyle())
    }

    private func chipColor(_ status: ApplicationStatus) -> Color {
        switch status {
        case .paid: Theme.Colors.success
        case .rejected, .expired: Theme.Colors.danger
        default: Theme.Colors.amber
        }
    }

    private func terminalTitle(_ status: ApplicationStatus) -> String {
        status == .rejected ? "Not a fit this time" : "48-hour window expired"
    }

    private func terminalDetail(_ status: ApplicationStatus) -> String {
        status == .rejected
            ? "Our reviewer didn't find the right batch fit right now. Your deposit is refunded in full (5–7 business days) — and you're welcome to apply again."
            : "The balance window lapsed, so the slot was released to the next applicant. Your deposit is refunded per policy — reach out on WhatsApp and we'll help you rebook."
    }

    // MARK: - Cards

    private func kycCard(_ app: Application) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Label("Complete your profile", systemImage: "person.text.rectangle")
                    .font(Theme.Typo.bodyMedium)
                    .foregroundStyle(Theme.Colors.text)
                Spacer()
                StatusChip(
                    text: app.kycStatus.label,
                    color: app.kycStatus == .approved ? Theme.Colors.success : Theme.Colors.amber
                )
            }
            Text("Bio, emergency contact, and a few logistics. Reviewers read this — it speeds up your decision.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
            if app.kycStatus == .pending {
                PrimaryButton(title: "Complete profile") { showKyc = true }
            }
        }
        .padding(Theme.Spacing.md)
        .glassCard()
    }

    /// Mock-only control so the demo can walk the pipeline without a backend.
    private var demoReviewCard: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("Nothing you need to do right now — a human is on it.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
            #if DEBUG
            // Debug-only: lets the demo walk the pipeline without a backend.
            Button {
                withAnimation(Theme.Motion.spring) { appState.advance(to: .approved) }
            } label: {
                Label("Demo: simulate reviewer approval", systemImage: "wand.and.stars")
                    .font(Theme.Typo.label)
                    .foregroundStyle(Theme.Colors.textMuted)
            }
            #endif
        }
    }

    @ViewBuilder
    private func balanceCard(_ app: Application) -> some View {
        let batch = MockAPIClient.batches.first { $0.id == app.batchId }
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("You're approved. Pay the balance to confirm your seat.")
                .font(Theme.Typo.bodyMedium)
                .foregroundStyle(Theme.Colors.text)
            if let deadline = app.balanceDueDeadline {
                Label {
                    Text("Window closes \(deadline.formatted(date: .abbreviated, time: .shortened)) — \(timeLeft(until: deadline)) left")
                } icon: {
                    Image(systemName: "clock.badge.exclamationmark")
                }
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.danger)
            }
            PrimaryButton(title: "Pay my balance — lock my seat") { showBalanceSheet = true }
            Text("Balance due: \((batch?.balanceAmount ?? 0).inr)")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
        }
        .padding(Theme.Spacing.md)
        .glassCard(stroke: Theme.Colors.amber)
        .sheet(isPresented: $showBalanceSheet) {
            MockCheckoutSheet(
                amount: batch?.balanceAmount ?? 0,
                purpose: "Balance — \(app.batchName)"
            ) {
                showBalanceSheet = false
                withAnimation(Theme.Motion.spring) { appState.advance(to: .paid) }
            }
            .presentationDetents([.medium, .large])
            .presentationCornerRadius(Theme.Radius.sheet)
        }
    }

    private func timeLeft(until date: Date) -> String {
        let seconds = max(0, date.timeIntervalSinceNow)
        let hours = Int(seconds / 3600)
        let minutes = Int(seconds.truncatingRemainder(dividingBy: 3600) / 60)
        return "\(hours)h \(minutes)m"
    }

    // MARK: - Rows

    private enum StepState { case done, current, upcoming, failed }

    private func timelineRow(title: String, detail: String, state: StepState, isLast: Bool) -> some View {
        HStack(alignment: .top, spacing: Theme.Spacing.md) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .fill(state == .upcoming ? Theme.Colors.forest.opacity(0.12)
                              : state == .failed ? Theme.Colors.danger : Theme.Colors.amber)
                        .frame(width: 26, height: 26)
                    switch state {
                    case .done:
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Theme.Colors.ink)
                    case .current:
                        Circle().fill(Theme.Colors.ink).frame(width: 8, height: 8)
                    case .failed:
                        Image(systemName: "xmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white)
                    case .upcoming:
                        EmptyView()
                    }
                }
                if !isLast {
                    Rectangle()
                        .fill(state == .done ? Theme.Colors.amber : Theme.Colors.forest.opacity(0.15))
                        .frame(width: 2)
                        .frame(minHeight: 36)
                }
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(state == .current ? Theme.Typo.bodyMedium : Theme.Typo.body)
                    .foregroundStyle(state == .upcoming ? Theme.Colors.textMuted
                                     : state == .failed ? Theme.Colors.danger : Theme.Colors.text)
                Text(detail)
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, Theme.Spacing.md)
            }
        }
    }
}

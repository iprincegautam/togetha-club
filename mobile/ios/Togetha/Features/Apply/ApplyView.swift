import SwiftUI

struct ApplyView: View {
    let batch: Batch
    var prefilledDeparture: Date? = nil
    let onDone: () -> Void

    @Environment(\.dismiss) private var dismiss
    @Environment(\.api) private var api
    @Environment(AppState.self) private var appState

    private enum Stage { case form, deposit, reserved }

    @State private var stage: Stage = .form
    @State private var step = 0

    // Step 1 — about you
    @State private var name = ""
    @State private var age = ""
    @State private var gender = "Woman"
    @State private var city = ""
    // Step 2 — intent + logistics
    @State private var intent = "Open to meeting someone"
    @State private var departure: Date?
    @State private var plan: PaymentPlan = .deposit
    @State private var aboutLine = ""

    @State private var submitting = false

    private let intents = ["Hoping to meet someone", "Open to meeting someone", "Mostly here for the travel"]

    private var payNowAmount: Int { plan == .full ? batch.priceTotal : batch.depositAmount }

    var body: some View {
        NavigationStack {
            Group {
                switch stage {
                case .form: formStages
                case .deposit:
                    DepositView(batch: batch, plan: plan) { advanceToReserved() }
                case .reserved:
                    StatusReservedView(paidInFull: plan == .full) { onDone() }
                }
            }
            .background { AmbientBackground() }
            .trackScreen("Apply:\(batch.id)")
            .toolbar {
                if stage != .reserved {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close") { dismiss() }
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                }
            }
            .animation(Theme.Motion.spring, value: stage)
            .animation(Theme.Motion.spring, value: step)
        }
        .interactiveDismissDisabled(stage == .reserved)
        .onAppear {
            departure = prefilledDeparture ?? batch.departures.first
            // Pre-fill from the profile + quiz — we never re-ask what we already have.
            let p = MockAPIClient.profile
            if name.isEmpty { name = p.name }
            if city.isEmpty { city = p.city }
            gender = ["Woman", "Man"].contains(p.gender) ? p.gender : "Non-binary"
            if age.isEmpty { age = appState.quizAnswers["age"] ?? "" }
            EngagementTracker.shared.applyStart(batchId: batch.id)
        }
    }

    // MARK: - Form

    private var formStages: some View {
        VStack(spacing: 0) {
            stepIndicator
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    switch step {
                    case 0: intentStep
                    default: reviewStep
                    }
                }
                .padding(Theme.Spacing.md)
            }
            .scrollDismissesKeyboard(.interactively)
            footerButton
        }
    }

    private var stepIndicator: some View {
        HStack(spacing: Theme.Spacing.sm) {
            ForEach(0..<2, id: \.self) { i in
                Capsule()
                    .fill(i <= step ? Theme.Colors.amber : Theme.Colors.forest.opacity(0.15))
                    .frame(height: 4)
            }
        }
        .padding(.horizontal, Theme.Spacing.md)
        .padding(.top, Theme.Spacing.sm)
    }

    private var intentStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            header("Intent & logistics", "Honesty helps us build a batch that works for you.")
            picker("What you're here for", selection: $intent, options: intents)

            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("Friday departure")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                VStack(spacing: Theme.Spacing.xs + 2) {
                    ForEach(batch.departures, id: \.self) { date in
                        selectableRow(
                            date.formatted(.dateTime.weekday(.wide).day().month(.wide).year()),
                            selected: departure == date
                        ) { departure = date }
                    }
                }
            }

            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("Payment plan")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                selectableRow("30% deposit now · \(batch.depositAmount.inr)", selected: plan == .deposit) { plan = .deposit }
                selectableRow("Pay in full · \(batch.priceTotal.inr)", selected: plan == .full) { plan = .full }
                Text(batch.depositCopy)
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.amber)
            }

            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("One honest line about you")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                TextField("e.g. I laugh loudly and pack too light", text: $aboutLine, axis: .vertical)
                    .lineLimit(2...4)
                    .padding(Theme.Spacing.md)
                    .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
            }
        }
    }

    /// Compatibility for this batch — real score post-quiz, stable teaser otherwise.
    private var matchPercent: Int {
        let stable = batch.id.utf8.reduce(0) { $0 + Int($1) }
        if appState.quizCompleted, let r = appState.lastMatchResult {
            return r.recommendedBatchId == batch.id ? r.score : max(72, r.score - 4 - (stable % 6))
        }
        return 87 + (stable % 9)
    }

    /// The visualise-it card: compatibility + the outcomes people picture before booking.
    private var outcomesCard: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack(alignment: .firstTextBaseline, spacing: Theme.Spacing.sm) {
                Text("\(matchPercent)%")
                    .font(Theme.Typo.hero())
                    .foregroundStyle(Theme.Colors.amber)
                VStack(alignment: .leading, spacing: 0) {
                    Text("compatibility")
                        .font(Theme.Typo.bodyMedium).foregroundStyle(Theme.Colors.text)
                    Text("with this batch")
                        .font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
                }
                Spacer()
                Image(systemName: "sparkles").font(.system(size: 24)).foregroundStyle(Theme.Colors.amberSoft)
            }
            Divider().overlay(Theme.Colors.stroke)
            outcome("person.2.fill", "You'll travel with 23 AI-matched, verified singles — your kind of people.")
            outcome("heart.fill", "60% of travelers report something meaningful changed within 3 months.")
            outcome("flame.fill", "Bonfire nights and 2am conversations. Picture yourself already there.")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .glassCard(stroke: Theme.Colors.amber)
    }

    private func outcome(_ icon: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: Theme.Spacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(Theme.Colors.womenAccent)
                .frame(width: 18)
            Text(text)
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.text)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var reviewStep: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            header("Review", "Next: \(payNowAmount.inr) reserves your screening slot.")

            outcomesCard

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                reviewRow("Batch", batch.name)
                reviewRow("Departure", departure?.formatted(date: .abbreviated, time: .omitted) ?? "—")
                reviewRow("Name", name.isEmpty ? "—" : name)
                reviewRow("Age", age.isEmpty ? "—" : age)
                reviewRow("Gender", gender)
                reviewRow("City", city.isEmpty ? "—" : city)
                reviewRow("Intent", intent)
                reviewRow("Plan", plan.label)
                if !aboutLine.isEmpty { reviewRow("About", aboutLine) }
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))

            Text("After payment, a human reviews your profile in 24–36 hours. The deposit doesn't confirm a seat — once approved you'll have 48 hours to pay the balance. If it's not a fit, your money comes back in 5–7 business days.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var footerButton: some View {
        PrimaryButton(
            title: step < 1 ? "Continue" : "Continue to payment",
            isLoading: submitting
        ) {
            if step < 1 {
                withAnimation(Theme.Motion.spring) { step += 1 }
            } else {
                Task { await submit() }
            }
        }
        .disabled(departure == nil || submitting)
        .padding(Theme.Spacing.md)
    }

    private func submit() async {
        submitting = true
        defer { submitting = false }
        var form = [
            "name": name, "age": age, "gender": gender, "city": city,
            "intent": intent, "about": aboutLine, "payment_plan": plan.rawValue
        ]
        if let departure { form["departure"] = "\(departure.timeIntervalSince1970)" }
        if let app = try? await api.submitApplication(batchId: batch.id, form: form) {
            appState.application = app
            withAnimation(Theme.Motion.spring) { stage = .deposit }
        }
    }

    private func advanceToReserved() {
        appState.markDepositPaid(for: batch, plan: plan)
        withAnimation(Theme.Motion.spring) { stage = .reserved }
    }

    // MARK: - Bits

    private func header(_ title: String, _ subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(title).font(Theme.Typo.title()).foregroundStyle(Theme.Colors.brandText)
            Text(subtitle).font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
        }
    }

    private func selectableRow(_ label: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button {
            withAnimation(Theme.Motion.springSnappy) { action() }
        } label: {
            HStack {
                Text(label).font(Theme.Typo.body).foregroundStyle(Theme.Colors.text)
                Spacer()
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(selected ? Theme.Colors.amber : Theme.Colors.textMuted)
            }
            .padding(Theme.Spacing.sm + 4)
            .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.button)
                    .strokeBorder(selected ? Theme.Colors.amber : Theme.Colors.stroke)
            )
        }
        .buttonStyle(SpringPressStyle())
    }

    private func picker(_ label: String, selection: Binding<String>, options: [String]) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(label).font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
            VStack(spacing: Theme.Spacing.xs + 2) {
                ForEach(options, id: \.self) { option in
                    selectableRow(option, selected: selection.wrappedValue == option) {
                        selection.wrappedValue = option
                    }
                }
            }
        }
    }

    private func reviewRow(_ label: String, _ value: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label).font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
            Spacer()
            Text(value)
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.text)
                .multilineTextAlignment(.trailing)
        }
    }
}

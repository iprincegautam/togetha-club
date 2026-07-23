import SwiftUI

struct QuizView: View {
    let batch: Batch
    /// Previous answers — passed when re-running the quiz in editing mode.
    var initialAnswers: [String: String] = [:]
    /// Onboarding mode: no Close button; `onFinished` routes to the main tabs.
    var isMandatory = false
    var onFinished: (() -> Void)? = nil

    @Environment(\.dismiss) private var dismiss
    @Environment(\.api) private var api
    @Environment(AppState.self) private var appState

    private let questions = QuizData.questions
    @State private var index = 0
    @State private var answers: [String: String] = [:]
    @State private var showResult = false
    @State private var result: MatchResult?

    // Per-kind scratch state
    @State private var ageText = ""
    @State private var rangeValue: Double = 5
    @State private var freeText = ""

    private var progress: Double { Double(index) / Double(questions.count) }

    /// The batch whose Friday departures we show in the last question —
    /// resolved from destination + age answers so the edition is correct.
    private var departureBatch: Batch {
        let age = Int(answers["age"] ?? "") ?? 0
        let isHimalayan = (answers["destination"] ?? "Himalayan") == "Himalayan"
        let wantsGenZ = age > 0 && age <= 25
        return MockAPIClient.batches.first {
            !$0.isWaitlistOnly
                && $0.region.localizedCaseInsensitiveContains(isHimalayan ? "Himachal" : "Rajasthan")
                && $0.edition == (wantsGenZ ? .genZ : .millennial)
        } ?? batch
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: Theme.Spacing.lg) {
                progressBar

                if index < questions.count {
                    ScrollView {
                        questionView(questions[index])
                            .id(questions[index].id)
                            .transition(.asymmetric(
                                insertion: .move(edge: .trailing).combined(with: .opacity),
                                removal: .move(edge: .leading).combined(with: .opacity)
                            ))
                    }
                    .scrollDismissesKeyboard(.interactively)
                }

                Spacer(minLength: 0)

                Text("This helps us see if Togetha is a fit — it's not a score.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.bottom, Theme.Spacing.sm)
            }
            .padding(Theme.Spacing.md)
            .background { AmbientBackground() }
            .animation(Theme.Motion.spring, value: index)
            .trackScreen("Quiz")
            .toolbar {
                if !isMandatory {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close") { dismiss() }
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                }
                ToolbarItem(placement: .principal) {
                    Text("\(questions.count) honest questions")
                        .font(Theme.Typo.h2())
                        .foregroundStyle(Theme.Colors.brandText)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .fullScreenCover(isPresented: $showResult) {
                if let result {
                    MatchResultView(result: result, answers: answers, onDone: { finish() })
                }
            }
        }
        .onAppear {
            EngagementTracker.shared.quizStart(batchId: batch.id)
            if answers.isEmpty, !initialAnswers.isEmpty {
                answers = initialAnswers
            }
            syncScratch()
        }
        .onChange(of: index) { _, _ in syncScratch() }
    }

    private func finish() {
        if let onFinished { onFinished() } else { dismiss() }
    }

    /// Pre-fills per-kind scratch state from stored answers (editing mode).
    private func syncScratch() {
        guard index < questions.count else { return }
        let q = questions[index]
        let stored = answers[q.id]
        switch q.kind {
        case .numeric: ageText = stored ?? ageText
        case .range: rangeValue = Double(stored ?? "") ?? rangeValue
        case .text: freeText = stored ?? ""
        default: break
        }
    }

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.Colors.forest.opacity(0.15))
                Capsule()
                    .fill(Theme.Colors.amber)
                    .frame(width: geo.size.width * progress)
                    .animation(Theme.Motion.spring, value: progress)
            }
        }
        .frame(height: 6)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Question \(min(index + 1, questions.count)) of \(questions.count)")
    }

    // MARK: - Question rendering

    @ViewBuilder
    private func questionView(_ q: QuizQuestion) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text("QUESTION \(index + 1) OF \(questions.count)")
                .font(Theme.Typo.label)
                .kerning(1.5)
                .foregroundStyle(Theme.Colors.amber)

            Text(q.prompt)
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)

            if !q.subtitle.isEmpty {
                Text(q.subtitle)
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            switch q.kind {
            case .numeric: numericInput(q)
            case .choice, .destination: choiceInput(q)
            case .range: rangeInput(q)
            case .text: textInput(q)
            case .departure: departureInput(q)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func numericInput(_ q: QuizQuestion) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            TextField("Your age", text: $ageText)
                .keyboardType(.numberPad)
                .font(Theme.Typo.hero())
                .padding(Theme.Spacing.md)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))

            if let age = Int(ageText), (18...99).contains(age) {
                StatusChip(
                    text: age <= 25 ? "GenZ Edition · 18–25" : (age <= 36 ? "Millennial Edition · 26–36" : "Outside our current bands"),
                    color: age <= 36 ? Theme.Colors.success : Theme.Colors.danger
                )
                .transition(.scale(scale: 0.85).combined(with: .opacity))
            }

            PrimaryButton(title: "Continue") {
                commit(q, value: ageText)
            }
            .disabled(Int(ageText).map { !(18...99).contains($0) } ?? true)
        }
        .animation(Theme.Motion.springSnappy, value: ageText)
    }

    private func choiceInput(_ q: QuizQuestion) -> some View {
        VStack(spacing: Theme.Spacing.sm) {
            ForEach(q.options) { option in
                Button {
                    selectChoice(option.text, for: q)
                } label: {
                    HStack {
                        Text(option.text)
                            .font(Theme.Typo.body)
                            .foregroundStyle(Theme.Colors.text)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer()
                        Image(systemName: answers[q.id] == option.text ? "largecircle.fill.circle" : "circle")
                            .foregroundStyle(answers[q.id] == option.text ? Theme.Colors.amber : Theme.Colors.textMuted)
                    }
                    .padding(Theme.Spacing.md)
                    .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.Radius.button)
                            .strokeBorder(answers[q.id] == option.text ? Theme.Colors.amber : Theme.Colors.stroke)
                    )
                }
                .buttonStyle(SpringPressStyle())
            }
        }
        .padding(.top, Theme.Spacing.sm)
    }

    private func rangeInput(_ q: QuizQuestion) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text("\(Int(rangeValue))")
                .font(Theme.Typo.hero())
                .foregroundStyle(Theme.Colors.amber)
                .frame(maxWidth: .infinity)
                .contentTransition(.numericText())
                .animation(Theme.Motion.springSnappy, value: rangeValue)

            Slider(value: $rangeValue, in: 1...10, step: 1)
                .tint(Theme.Colors.amber)

            HStack {
                Text("1").font(Theme.Typo.label).foregroundStyle(Theme.Colors.textMuted)
                Spacer()
                Text("10").font(Theme.Typo.label).foregroundStyle(Theme.Colors.textMuted)
            }

            PrimaryButton(title: "Continue") {
                commit(q, value: "\(Int(rangeValue))")
            }
        }
    }

    private func textInput(_ q: QuizQuestion) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            TextField("Write it here…", text: $freeText, axis: .vertical)
                .lineLimit(4...8)
                .padding(Theme.Spacing.md)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))

            Text("\(freeText.count) characters — depth counts.")
                .font(Theme.Typo.label)
                .foregroundStyle(Theme.Colors.textMuted)

            PrimaryButton(title: "Continue") {
                commit(q, value: freeText)
            }
            .disabled(freeText.trimmingCharacters(in: .whitespaces).isEmpty)
        }
    }

    private func departureInput(_ q: QuizQuestion) -> some View {
        VStack(spacing: Theme.Spacing.sm) {
            ForEach(departureBatch.departures, id: \.self) { date in
                Button {
                    commit(q, value: "\(date.timeIntervalSince1970)")
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(date.formatted(.dateTime.weekday(.wide).day().month(.wide).year()))
                                .font(Theme.Typo.bodyMedium)
                                .foregroundStyle(Theme.Colors.text)
                            Text(departureBatch.name)
                                .font(Theme.Typo.label)
                                .foregroundStyle(Theme.Colors.textMuted)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.Colors.amber)
                    }
                    .padding(Theme.Spacing.md)
                    .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
                }
                .buttonStyle(SpringPressStyle())
            }
        }
        .padding(.top, Theme.Spacing.sm)
    }

    // MARK: - Flow

    private func selectChoice(_ option: String, for q: QuizQuestion) {
        answers[q.id] = option
        Task {
            try? await Task.sleep(nanoseconds: 250_000_000)
            advance()
        }
    }

    private func commit(_ q: QuizQuestion, value: String) {
        answers[q.id] = value
        freeText = ""
        advance()
    }

    private func advance() {
        if index < questions.count - 1 {
            withAnimation(Theme.Motion.spring) { index += 1 }
        } else {
            Task {
                try? await api.submitQuiz(answers: answers)
                let evaluated = MatchEngine.evaluate(answers: answers, batches: MockAPIClient.batches)
                appState.completeQuiz(answers: answers, result: evaluated)
                result = evaluated
                showResult = true
            }
        }
    }
}

// MARK: - Match result screen

struct MatchResultView: View {
    let result: MatchResult
    let answers: [String: String]
    let onDone: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var scoreShown = 0
    @State private var revealed = false
    @State private var showApply = false

    private var recommendedBatch: Batch? {
        MockAPIClient.batches.first { $0.id == result.recommendedBatchId }
    }

    private var tierColor: Color {
        switch result.placementTier {
        case .high: Theme.Colors.success
        case .medium: Theme.Colors.amber
        case .growing: Theme.Colors.womenAccent
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    scoreRing
                    archetypeCard
                    batchRecommendation
                    Text(result.narrative)
                        .font(Theme.Typo.body)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .multilineTextAlignment(.center)

                    if result.ageOutOfBand {
                        Text("Heads up: your age is outside this batch's band, which caps the fit score. Our team reads every application anyway.")
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.danger)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(Theme.Spacing.md)
                .padding(.bottom, 120)
            }
            .background { AmbientBackground() }
            .trackScreen("MatchResult")
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: Theme.Spacing.sm) {
                    if recommendedBatch != nil {
                        PrimaryButton(title: "Reserve my screening slot", systemImage: "arrow.right") {
                            if let b = recommendedBatch {
                                EngagementTracker.shared.applyStart(batchId: b.id)
                            }
                            showApply = true
                        }
                    }
                    Button("Not now") { onDone(); dismiss() }
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.bottom, Theme.Spacing.sm)
                .background(.ultraThinMaterial)
            }
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Your read")
                        .font(Theme.Typo.h2())
                        .foregroundStyle(Theme.Colors.brandText)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .fullScreenCover(isPresented: $showApply) {
                if let b = recommendedBatch {
                    ApplyView(batch: b, prefilledDeparture: prefilledDeparture(for: b), onDone: {
                        onDone()
                        dismiss()
                    })
                }
            }
            .onAppear(perform: animateIn)
        }
    }

    private func prefilledDeparture(for batch: Batch) -> Date? {
        guard let raw = answers["departure"], let interval = TimeInterval(raw) else { return nil }
        let date = Date(timeIntervalSince1970: interval)
        return batch.departures.min { abs($0.timeIntervalSince(date)) < abs($1.timeIntervalSince(date)) }
    }

    private var scoreRing: some View {
        ZStack {
            Circle()
                .stroke(Theme.Colors.forest.opacity(0.12), lineWidth: 10)
            Circle()
                .trim(from: 0, to: revealed ? CGFloat(result.score) / 100 : 0)
                .stroke(tierColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 2) {
                Text("\(scoreShown)%")
                    .font(Theme.Typo.hero())
                    .foregroundStyle(Theme.Colors.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .contentTransition(.numericText())
                Text(result.placementTier.label)
                    .font(Theme.Typo.label)
                    .foregroundStyle(tierColor)
            }
        }
        .frame(width: 170, height: 170)
        .padding(.top, Theme.Spacing.lg)
    }

    private var archetypeCard: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Image(systemName: result.archetype.icon)
                .font(.system(size: 34))
                .foregroundStyle(Theme.Colors.amber)
            Text(result.archetype.rawValue)
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
            Text(result.archetype.blurb)
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.lg)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.amber.opacity(0.4)))
        .scaleEffect(revealed ? 1 : 0.92)
        .opacity(revealed ? 1 : 0)
    }

    @ViewBuilder
    private var batchRecommendation: some View {
        if let batch = recommendedBatch {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("YOUR BATCH")
                    .font(Theme.Typo.label)
                    .kerning(2)
                    .foregroundStyle(Theme.Colors.amber)
                Text(batch.name)
                    .font(Theme.Typo.h2())
                    .foregroundStyle(Theme.Colors.text)
                Text("\(batch.route) · \(batch.durationText) · \(batch.ageBandText) · \(batch.priceTotal.inr)")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                Text(batch.depositCopy)
                    .font(Theme.Typo.caption.weight(.medium))
                    .foregroundStyle(Theme.Colors.amber)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Theme.Spacing.md)
            .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
        }
    }

    private func animateIn() {
        withAnimation(Theme.Motion.spring.delay(0.2)) { revealed = true }
        Task {
            for step in stride(from: 0, through: result.score, by: max(1, result.score / 24)) {
                scoreShown = step
                try? await Task.sleep(nanoseconds: 30_000_000)
            }
            withAnimation(Theme.Motion.springSnappy) { scoreShown = result.score }
        }
    }
}

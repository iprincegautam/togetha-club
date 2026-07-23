import SwiftUI

/// "My quiz & compatibility" — score, archetype, age band, recommended batch,
/// and the entry point to re-run the quiz prefilled with previous answers.
struct MyQuizView: View {
    @Environment(AppState.self) private var appState
    @State private var showQuiz = false

    private var result: MatchResult? { appState.lastMatchResult }

    private var recommendedBatch: Batch? {
        guard let result else { return nil }
        return MockAPIClient.batches.first { $0.id == result.recommendedBatchId }
    }

    private var ageBandText: String {
        switch appState.ageBand {
        case .genZ: "GenZ Edition · 18–25"
        case .millennial: "Millennial Edition · 26–36"
        case .other: "Outside our current bands"
        case .unknown: "Take the quiz to find out"
        }
    }

    private var tierColor: Color {
        switch result?.placementTier {
        case .high: Theme.Colors.success
        case .medium: Theme.Colors.amber
        default: Theme.Colors.womenAccent
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.lg) {
                if let result {
                    scoreRing(result)
                    archetypeCard(result)
                    detailsCard(result)
                    PrimaryButton(title: "Edit my answers", systemImage: "pencil") {
                        showQuiz = true
                    }
                    Text("Editing re-runs your fit read and updates which editions you see on Discover.")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .multilineTextAlignment(.center)
                } else {
                    emptyState
                }
            }
            .padding(Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .navigationTitle("My quiz & compatibility")
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("MyQuiz")
        .fullScreenCover(isPresented: $showQuiz) {
            // Same 13-question quiz, prefilled with previous answers.
            QuizView(
                batch: recommendedBatch ?? MockAPIClient.batches.first { !$0.isWaitlistOnly } ?? MockAPIClient.batches[0],
                initialAnswers: appState.quizAnswers
            )
        }
    }

    private func scoreRing(_ result: MatchResult) -> some View {
        ZStack {
            Circle()
                .stroke(Theme.Colors.forest.opacity(0.12), lineWidth: 10)
            Circle()
                .trim(from: 0, to: CGFloat(result.score) / 100)
                .stroke(tierColor, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                .rotationEffect(.degrees(-90))
            VStack(spacing: 2) {
                Text("\(result.score)%")
                    .font(Theme.Typo.hero())
                    .foregroundStyle(Theme.Colors.text)
                Text(result.placementTier.label)
                    .font(Theme.Typo.label)
                    .foregroundStyle(tierColor)
            }
        }
        .frame(width: 150, height: 150)
        .padding(.top, Theme.Spacing.md)
    }

    private func archetypeCard(_ result: MatchResult) -> some View {
        VStack(spacing: Theme.Spacing.sm) {
            Image(systemName: result.archetype.icon)
                .font(.system(size: 30))
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
    }

    private func detailsCard(_ result: MatchResult) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            row("Age band", ageBandText)
            Divider()
            row("Recommended batch", result.recommendedBatchName)
            if let batch = recommendedBatch {
                Text("\(batch.route) · \(batch.durationText) · \(batch.priceTotal.inr)")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
    }

    private func row(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(Theme.Typo.label)
                .kerning(1)
                .foregroundStyle(Theme.Colors.amber)
            Text(value)
                .font(Theme.Typo.bodyMedium)
                .foregroundStyle(Theme.Colors.text)
        }
    }

    private var emptyState: some View {
        VStack(spacing: Theme.Spacing.md) {
            Text("No quiz on file yet")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.text)
            Text("The 13-question quiz reads your fit and picks your edition. It takes about three minutes.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
            PrimaryButton(title: "Check my fit", systemImage: "arrow.right") { showQuiz = true }
        }
        .padding(.top, Theme.Spacing.xl)
    }
}

import SwiftUI

struct OnboardingView: View {
    let onFinish: () -> Void
    @State private var page = 0

    private let pages: [OnboardingPage] = [
        OnboardingPage(
            eyebrow: "TOGETHA.CLUB",
            title: "Travel with strangers.",
            body: "Curated small-group trips across India — Himalayan passes, Udaipur rooftops, quiet coasts.",
            gradient: [Color(hex: 0x1F3A34), Color(hex: 0x0E1F1B)]
        ),
        OnboardingPage(
            eyebrow: "THE POINT",
            title: "Leave with your person.",
            body: "Every batch is built so the mix of people actually works. No swiping. Just days spent well, togetha.",
            gradient: [Color(hex: 0x2E4A42), Color(hex: 0x152825)]
        ),
        OnboardingPage(
            eyebrow: "TRUST, BY DESIGN",
            title: "Not everyone gets in. That's the point.",
            body: "Our batches run women-majority, and a real person reviews every single application before anyone joins. Screening isn't a hurdle — it's the product.",
            gradient: [Color(hex: 0x3E4A54), Color(hex: 0x101C19)],
            showTrust: true
        ),
        OnboardingPage(
            eyebrow: "HOW IT WORKS",
            title: "Apply. Get screened. Get matched.",
            body: "A deposit reserves your screening slot — a human reviews your application in 24–36 hours. If it's a fit, you pay the balance and join your batch.",
            gradient: [Color(hex: 0x1F3A34), Color(hex: 0x101C19)],
            isLast: true
        )
    ]

    var body: some View {
        TabView(selection: $page) {
            ForEach(Array(pages.enumerated()), id: \.offset) { index, p in
                pageView(p)
                    .tag(index)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: .always))
        .ignoresSafeArea()
        .animation(Theme.Motion.spring, value: page)
    }

    @ViewBuilder
    private func pageView(_ p: OnboardingPage) -> some View {
        ZStack {
            LinearGradient(colors: p.gradient, startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                Spacer()

                Text(p.eyebrow)
                    .font(Theme.Typo.label)
                    .kerning(2)
                    .foregroundStyle(Theme.Colors.amber)

                Text(p.title)
                    .font(Theme.Typo.hero())
                    .foregroundStyle(Theme.Colors.offWhite)
                    .lineLimit(3)
                    .minimumScaleFactor(0.75)
                    .fixedSize(horizontal: false, vertical: true)

                Text(p.body)
                    .font(Theme.Typo.body)
                    .foregroundStyle(Theme.Colors.offWhite.opacity(0.8))
                    .fixedSize(horizontal: false, vertical: true)

                if p.showTrust {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        GenderBalanceBar(women: 14, men: 9)
                        VerifiedBadge(text: "Every traveller human-screened")
                    }
                    .padding(Theme.Spacing.md)
                    .background(.white.opacity(0.07), in: RoundedRectangle(cornerRadius: Theme.Radius.card))
                }

                if p.isLast {
                    PrimaryButton(title: "Continue") { onFinish() }
                        .padding(.top, Theme.Spacing.sm)
                }

                Spacer().frame(height: Theme.Spacing.xxl + Theme.Spacing.md)
            }
            .padding(.horizontal, Theme.Spacing.lg)
        }
    }
}

private struct OnboardingPage {
    let eyebrow: String
    let title: String
    let body: String
    let gradient: [Color]
    var showTrust = false
    var isLast = false
}

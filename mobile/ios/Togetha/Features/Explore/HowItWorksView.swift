import SwiftUI

struct HowItWorksView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                ExploreHero(
                    eyebrow: "✦ How It Works ✦",
                    headline: "Quiz → book → **mountains.**",
                    sub: "Take the quiz, pick your Friday, pay on the website — then show up with 12 women and 12 men for 5 nights across Manali, Sissu, and Kasol."
                )

                CaptionedPhoto(image: ExploreImage(
                    name: "himalayan-how-it-works-funnel",
                    caption: "Quiz → match → pick your Friday → human review"
                ))
                .springReveal(delay: 0.1)

                stepsSection
                conceptSection
                aiSection
                faqSection
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .navigationTitle("How It Works")
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("HowItWorks")
    }

    // MARK: Steps

    private var stepsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            EyebrowLabel(text: "HOW IT WORKS")
            Text.styled("Four steps to **magic.**")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
            Text("Simple enough to explain at a dinner party.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)

            ForEach(Array(ExploreCopy.steps.enumerated()), id: \.offset) { index, step in
                HStack(alignment: .top, spacing: Theme.Spacing.md) {
                    Text(step.0)
                        .font(Theme.Typo.h2())
                        .foregroundStyle(Theme.Colors.amber)
                        .frame(width: 36, alignment: .leading)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(step.1)
                            .font(Theme.Typo.bodyMedium)
                            .foregroundStyle(Theme.Colors.text)
                        Text(step.2)
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(Theme.Spacing.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
                .springReveal(delay: Double(index) * 0.06)
            }
        }
    }

    // MARK: Concept ("The Idea")

    private var conceptSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            EyebrowLabel(text: "THE IDEA")
            Text.styled("Travel is the best **first date** you'll never plan.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)
            Text("Dating apps give you a photo and a 3-line bio. We give you 6 days in the Himalayas with 23 interesting, AI-matched, verified singles who all showed up for the same reason. If there's a spark, you'll know it — and it'll be real.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            LazyVGrid(columns: [GridItem(.flexible(), spacing: Theme.Spacing.sm), GridItem(.flexible())], spacing: Theme.Spacing.sm) {
                ForEach(Array(ExploreCopy.conceptStats.enumerated()), id: \.offset) { index, stat in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(stat.0)
                            .font(.system(size: 32, weight: .semibold, design: .serif))
                            .foregroundStyle(Theme.Colors.amber)
                        Text(stat.1)
                            .font(Theme.Typo.bodyMedium)
                            .foregroundStyle(Theme.Colors.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(stat.2)
                            .font(Theme.Typo.label)
                            .foregroundStyle(Theme.Colors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .padding(Theme.Spacing.md)
                    .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
                    .springReveal(delay: Double(index) * 0.05)
                }
            }
        }
    }

    // MARK: Our AI

    private var aiSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            EyebrowLabel(text: "✦ Our Secret Ingredient")
            Text.styled("Our AI picks your **24 batchmates.** Not randomly.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)
            Text("Every applicant fills a 10-question compatibility quiz — personality, values, communication style, love language, dreams, and the weird stuff nobody asks on dating apps. Our matching algorithm then builds each batch of 24 to maximise the probability of genuine connection, not just surface-level attraction.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            Text("We don't just look at who you are. We look at who you need to be around.")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)

            ChipFlow(chips: ExploreCopy.traitChips)

            CaptionedPhoto(image: ExploreImage(
                name: "himalayan-matchmaking-machine",
                caption: "The matchmaking machine — companions, not coincidences"
            ), height: 200)

            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("60%")
                    .font(.system(size: 48, weight: .semibold, design: .serif))
                    .foregroundStyle(Theme.Colors.amber)
                Text("of our travellers report their relationship status changing within 3 months of the trip.")
                    .font(Theme.Typo.bodyMedium)
                    .foregroundStyle(Theme.Colors.text)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Based on post-trip surveys from our 2025 pilot batches.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Theme.Spacing.md)
            .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("How the algorithm works")
                    .font(Theme.Typo.bodyMedium)
                    .foregroundStyle(Theme.Colors.brandText)
                Text("Your quiz answers are converted into a 12-dimension compatibility vector. We run a constrained optimisation across booked travelers to form a batch where average pairwise compatibility is maximised — while maintaining exact 12M/12F balance.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Result: you don't meet 23 random people. You meet 23 people our system thinks you'll actually connect with.")
                    .font(Theme.Typo.caption.weight(.medium))
                    .foregroundStyle(Theme.Colors.amber)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(Theme.Spacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.Colors.amber.opacity(0.08), in: RoundedRectangle(cornerRadius: Theme.Radius.card))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.amber.opacity(0.3)))
        }
    }

    // MARK: FAQ

    private var faqSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            SectionHeader(title: "Questions, answered.")
            ForEach(ExploreCopy.howItWorksFAQ) { item in
                FAQRow(item: item)
            }
        }
    }
}

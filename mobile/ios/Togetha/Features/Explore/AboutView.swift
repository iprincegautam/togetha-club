import SwiftUI

struct AboutView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    EyebrowLabel(text: "ABOUT US")
                    Text("Togetha.Club")
                        .font(Theme.Typo.hero())
                        .foregroundStyle(Theme.Colors.brandText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                    Text("India's first matchmaking travel club")
                        .font(Theme.Typo.body)
                        .foregroundStyle(Theme.Colors.amber)
                }
                .springReveal()

                CaptionedPhoto(image: ExploreImage(
                    name: "himalayan-campfire-friendships",
                    caption: "Manali · Kasol · Sissu — real friendships around the fire"
                ))
                .springReveal(delay: 0.1)

                Text("Togetha.Club is not a travel package company. We are an experience-driven matchmaking travel club for verified singles who want real connection — not another swipe session. The people are the product; the Himalayan batch is the context where chemistry actually has room to happen.")
                    .font(Theme.Typo.body)
                    .foregroundStyle(Theme.Colors.text)
                    .fixedSize(horizontal: false, vertical: true)

                block(
                    title: "What we do",
                    body: "Every month we run curated batches — GenZ (18–25) and Millennial (26–36) editions — with balanced cohorts, AI compatibility matching, and 5 nights across Manali, Sissu, and Kasol. Take the quiz, book your slot, pay online, and show up."
                )

                block(
                    title: "Where we're headed",
                    body: "Himachal is live today. Uttarakhand, J&K, Rajasthan, the Northeast, and festival-led lifestyle editions are on the roadmap — always with the same promise: verified singles, intentional matching, and trips built for connection."
                )

                VStack(alignment: .center, spacing: Theme.Spacing.sm) {
                    Text(ExploreCopy.footerTagline)
                        .font(.system(size: 18, weight: .medium, design: .serif).italic())
                        .foregroundStyle(Theme.Colors.brandText)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(ExploreCopy.copyrightLine)
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity)
                .padding(.top, Theme.Spacing.lg)
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("About")
    }

    private func block(title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text(title)
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.brandText)
            Text(body)
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
    }
}

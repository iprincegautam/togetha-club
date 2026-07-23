import SwiftUI

struct JournalView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                ExploreHero(
                    eyebrow: "✦ Togetha Journal",
                    headline: "Stories for singles who'd rather show up",
                    sub: "Dating app fatigue, what a matchmaking travel club actually is, and honest answers before you apply — SEO-enriched guides from India's first experience-driven singles club."
                )

                ForEach(Array(ExploreCopy.journalPosts.enumerated()), id: \.element.id) { index, post in
                    NavigationLink(value: post) {
                        JournalCard(post: post)
                    }
                    .buttonStyle(SpringPressStyle())
                    .springReveal(delay: Double(index) * 0.07)
                }
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .navigationTitle("Journal")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: ExploreCopy.JournalPost.self) { post in
            JournalReaderView(post: post)
        }
        .trackScreen("Journal")
    }
}

struct JournalCard: View {
    let post: ExploreCopy.JournalPost

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Image(post.imageName)
                .resizable()
                .scaledToFill()
                .frame(height: 150)
                .frame(maxWidth: .infinity)
                .clipped()

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text(post.tag.uppercased())
                    .font(Theme.Typo.label)
                    .kerning(1.5)
                    .foregroundStyle(Theme.Colors.amber)
                Text(post.title)
                    .font(Theme.Typo.h2())
                    .foregroundStyle(Theme.Colors.brandText)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Text(post.excerpt)
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(Theme.Spacing.md)
        }
        .background(Theme.Colors.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
    }
}

struct JournalReaderView: View {
    let post: ExploreCopy.JournalPost

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                Image(post.imageName)
                    .resizable()
                    .scaledToFill()
                    .frame(height: 200)
                    .frame(maxWidth: .infinity)
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))

                Text(post.tag.uppercased())
                    .font(Theme.Typo.label)
                    .kerning(1.5)
                    .foregroundStyle(Theme.Colors.amber)

                Text(post.title)
                    .font(Theme.Typo.title())
                    .foregroundStyle(Theme.Colors.brandText)
                    .fixedSize(horizontal: false, vertical: true)

                Text(post.excerpt)
                    .font(Theme.Typo.body)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)

                Link(destination: URL(string: "https://togetha.club/journal")!) {
                    HStack(spacing: Theme.Spacing.sm) {
                        Image(systemName: "arrow.up.right.square")
                        Text("Read the full story on togetha.club")
                    }
                    .font(Theme.Typo.bodyMedium)
                    .foregroundStyle(Theme.Colors.ink)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, Theme.Spacing.md)
                    .background(Theme.Colors.amber, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                }
                .buttonStyle(SpringPressStyle())
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("JournalPost")
    }
}

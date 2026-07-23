import SwiftUI

struct ItinerariesView: View {
    @State private var trip: ExploreTrip

    init(initialTrip: ExploreTrip = .himalayan) {
        _trip = State(initialValue: initialTrip)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                ExploreHero(
                    eyebrow: "✦ Itineraries ✦",
                    headline: "See exactly **where you'll go.**",
                    sub: "The full day-by-day for every Togetha trip — the route, the vibe, and what you leave with. No sign-up to look. When a trip feels like yours, take the 2-minute compatibility quiz and we'll match you into your best-fit batch."
                )

                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    PhotoGalleryCarousel(images: trip.gallery)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(trip.title)
                            .font(Theme.Typo.title())
                            .foregroundStyle(Theme.Colors.brandText)
                        Text(trip.durationLine)
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.amber)
                    }

                    ForEach(ExploreCopy.days(for: trip)) { day in
                        DayAccordionRow(day: day)
                    }
                }
                .id(trip)
                .springReveal()

                outcomesSection
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .navigationTitle("Itineraries")
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("Itineraries")
    }

    private var outcomesSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            EyebrowLabel(text: "WHAT YOU LEAVE WITH")
            Text("The part that outlasts the trip.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)

            LazyVGrid(columns: [GridItem(.flexible(), spacing: Theme.Spacing.sm), GridItem(.flexible())], spacing: Theme.Spacing.sm) {
                ForEach(Array(ExploreCopy.outcomes.enumerated()), id: \.offset) { index, outcome in
                    VStack(alignment: .leading, spacing: 6) {
                        Text(outcome.0)
                            .font(.system(size: 26))
                            .foregroundStyle(Theme.Colors.womenAccent)
                        Text(outcome.1)
                            .font(Theme.Typo.bodyMedium)
                            .foregroundStyle(Theme.Colors.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(outcome.2)
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

            Text(ExploreCopy.outcomesNote)
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Day accordion

struct DayAccordionRow: View {
    let day: ExploreCopy.ItinDay
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(Theme.Motion.spring) { expanded.toggle() }
            } label: {
                HStack(alignment: .firstTextBaseline, spacing: Theme.Spacing.md) {
                    Text(day.label)
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.amber)
                        .frame(width: 48, alignment: .leading)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(day.place)
                            .font(Theme.Typo.bodyMedium)
                            .foregroundStyle(Theme.Colors.text)
                        Text(day.subtitle)
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Theme.Colors.amber)
                        .rotationEffect(.degrees(expanded ? 180 : 0))
                }
                .padding(Theme.Spacing.md)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if expanded {
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    ForEach(day.bullets, id: \.self) { bullet in
                        HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                            Circle()
                                .fill(Theme.Colors.amber)
                                .frame(width: 4, height: 4)
                                .padding(.top, 7)
                            Text(bullet)
                                .font(Theme.Typo.caption)
                                .foregroundStyle(Theme.Colors.textMuted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    if let meals = day.meals {
                        HStack(spacing: 6) {
                            Image(systemName: "fork.knife")
                                .font(.system(size: 11))
                            Text("Meals included: \(meals)")
                                .font(Theme.Typo.label)
                        }
                        .foregroundStyle(Theme.Colors.success)
                        .padding(.top, Theme.Spacing.xs)
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.bottom, Theme.Spacing.md)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
    }
}

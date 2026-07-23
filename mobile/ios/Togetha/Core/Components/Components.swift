import SwiftUI

// MARK: - Ambient background
//
// The soft, blurred brand-color "bed" behind content. Glass only reads as glass
// when there's color and variation behind it to refract — a flat fill would make
// the frosted panels look grey. Every top-level screen sits on this.

struct AmbientBackground: View {
    var body: some View {
        ZStack {
            Theme.Colors.background
            // Very soft, high-up warm wash only — kept subtle so frosted cards
            // read cleanly instead of sitting on muddy colour.
            Circle().fill(Theme.Colors.amber.opacity(0.10))
                .frame(width: 420, height: 420).blur(radius: 140).offset(x: -160, y: -360)
            Circle().fill(Theme.Colors.forest.opacity(0.08))
                .frame(width: 420, height: 420).blur(radius: 150).offset(x: 180, y: -200)
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
    }
}

// MARK: - Glass surface modifiers

extension View {
    /// Frosted-glass panel: brand tint + material blur + light rim + soft shadow.
    /// Pass `stroke` to swap the rim for a semantic color (amber deadline, etc.).
    func glassCard(cornerRadius: CGFloat = Theme.Radius.card, stroke: Color? = nil) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius)
        let rim: AnyShapeStyle = stroke.map { AnyShapeStyle($0.opacity(0.55)) }
            ?? AnyShapeStyle(Theme.Glass.highlight)
        return self
            .background(Theme.Glass.tint, in: shape)
            .background(.ultraThinMaterial, in: shape)
            .overlay(shape.strokeBorder(rim, lineWidth: 1))
            // Two-layer soft float: a wide diffuse halo + a faint contact shadow,
            // both low-opacity so cards lift off the page without a hard edge.
            .shadow(color: Theme.Glass.shadow, radius: 26, y: 14)
            .shadow(color: Theme.Glass.shadow.opacity(0.5), radius: 5, y: 2)
    }

    /// Frosted capsule for chips and badges — keeps the semantic color, adds frost.
    func glassCapsule(tint: Color) -> some View {
        self
            .background(tint.opacity(0.18), in: Capsule())
            .background(.ultraThinMaterial, in: Capsule())
            .overlay(Capsule().strokeBorder(Theme.Glass.highlight, lineWidth: 0.75))
    }
}

// MARK: - Tia button visibility
//
// The floating Tia concierge lives at the tab-bar level, so it floats over any
// pushed screen too. Screens that pin their own bottom action bar (BatchDetail,
// Queries) hide it via `.hidesTiaButton()` so the FAB never covers a primary CTA.

struct HideTiaButtonKey: PreferenceKey {
    static let defaultValue = false
    static func reduce(value: inout Bool, nextValue: () -> Bool) {
        value = value || nextValue()
    }
}

extension View {
    func hidesTiaButton(_ hidden: Bool = true) -> some View {
        preference(key: HideTiaButtonKey.self, value: hidden)
    }
}

// MARK: - Spring press style

struct SpringPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1)
            .animation(Theme.Motion.springSnappy, value: configuration.isPressed)
    }
}

// MARK: - PrimaryButton

struct PrimaryButton: View {
    let title: String
    var systemImage: String? = nil
    var isLoading = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.sm) {
                if isLoading {
                    ProgressView().tint(Theme.Colors.ink)
                } else {
                    if let systemImage { Image(systemName: systemImage) }
                    Text(title)
                }
            }
            .font(Theme.Typo.bodyMedium)
            .foregroundStyle(Theme.Colors.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.md)
            .background(Theme.Colors.amber, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
        }
        .buttonStyle(SpringPressStyle())
        .disabled(isLoading)
    }
}

// MARK: - GenderBalanceBar

struct GenderBalanceBar: View {
    let women: Int
    let men: Int
    var compact = false

    @State private var animated = false

    private var womenFraction: Double {
        let total = women + men
        return total == 0 ? 0.5 : Double(women) / Double(total)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.Colors.forest.opacity(0.25))
                    Capsule()
                        .fill(Theme.Colors.womenAccent)
                        .frame(width: animated ? geo.size.width * womenFraction : 0)
                }
            }
            .frame(height: compact ? 6 : 8)

            HStack {
                Label("\(women) women", systemImage: "circle.fill")
                    .foregroundStyle(Theme.Colors.womenAccent)
                Spacer()
                Label("\(men) men", systemImage: "circle.fill")
                    .foregroundStyle(Theme.Colors.textMuted)
            }
            .font(Theme.Typo.label)
            .labelStyle(TinyDotLabelStyle())
        }
        .onAppear {
            withAnimation(Theme.Motion.spring.delay(0.15)) { animated = true }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Batch balance: \(women) women, \(men) men")
    }
}

struct TinyDotLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 4) {
            configuration.icon.font(.system(size: 6))
            configuration.title
        }
    }
}

// MARK: - VerifiedBadge

struct VerifiedBadge: View {
    var text = "Screened & verified"

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 11))
            Text(text)
                .font(Theme.Typo.label)
        }
        .foregroundStyle(Theme.Colors.success)
        .padding(.horizontal, Theme.Spacing.sm)
        .padding(.vertical, 5)
        .glassCapsule(tint: Theme.Colors.success)
    }
}

// MARK: - ScreeningExplainer

struct ScreeningExplainer: View {
    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: "person.badge.shield.checkmark")
                    .font(.system(size: 20))
                    .foregroundStyle(Theme.Colors.amber)
                Text("Everyone here was screened.")
                    .font(Theme.Typo.h2())
                    .foregroundStyle(Theme.Colors.brandText)
            }
            Text("That's why it works.")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.womenAccent)
            Text("Every applicant is reviewed by a real person before they can join a batch — quiz, application, and the balance of the group. It takes 24–36 hours and it's the reason our trips feel the way they do.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .glassCard()
    }
}

// MARK: - PhotoCard

/// Photo card with async-image semantics; in Phase 1 photos are solid-color
/// placeholders (no network), so the placeholder IS the image.
struct PhotoCard: View {
    let photo: TripPhoto
    /// Shows a small ✓ next to the uploader's name (badge only, no document data).
    var uploaderVerified = false

    var body: some View {
        // Every card is an identical square cell: the image (or placeholder)
        // fills the square (.fill + .clipped), and the caption sits in a
        // fixed-height overlay band so grid rows stay perfectly even.
        ZStack(alignment: .bottomLeading) {
            Color.clear
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    if let imageName = photo.imageName {
                        Image(imageName)
                            .resizable()
                            .scaledToFill()
                    } else {
                        LinearGradient(
                            colors: [photo.color, photo.color.opacity(0.7)],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        )
                        .overlay(alignment: .center) {
                            Image(systemName: "photo")
                                .font(.system(size: 24))
                                .foregroundStyle(.white.opacity(0.3))
                        }
                    }
                }
                .clipped()
                .overlay(
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.55)],
                        startPoint: .center, endPoint: .bottom
                    )
                )

            VStack(alignment: .leading, spacing: 2) {
                Spacer(minLength: 0)
                Text(photo.caption)
                    .font(Theme.Typo.caption.weight(.medium))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                HStack(spacing: 3) {
                    Text(photo.uploaderName)
                        .font(Theme.Typo.label)
                        .foregroundStyle(.white.opacity(0.75))
                    if uploaderVerified {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.Colors.amberSoft)
                            .accessibilityLabel("Verified")
                    }
                }
            }
            .frame(height: 46, alignment: .bottomLeading)
            .padding(Theme.Spacing.sm + 4)

            if photo.reviewState == .pending {
                VStack {
                    HStack {
                        Spacer()
                        Label("Waiting for review", systemImage: "clock")
                            .font(Theme.Typo.label)
                            .foregroundStyle(Theme.Colors.ink)
                            .padding(.horizontal, Theme.Spacing.sm)
                            .padding(.vertical, 4)
                            .background(Theme.Colors.amberSoft, in: Capsule())
                    }
                    Spacer()
                }
                .padding(Theme.Spacing.sm)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
    }
}

// MARK: - Shared bits

struct SectionHeader: View {
    let title: String

    var body: some View {
        Text(title)
            .font(Theme.Typo.h2())
            .foregroundStyle(Theme.Colors.brandText)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension Int {
    var inr: String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "en_IN")
        return "₹" + (f.string(from: NSNumber(value: self)) ?? "\(self)")
    }
}

// MARK: - Hero zoom transitions (iOS 18 zoom, graceful fallback on 17)

extension View {
    /// Marks this view as the source of a hero zoom navigation transition.
    @ViewBuilder
    func zoomTransitionSource(id: some Hashable, namespace: Namespace.ID) -> some View {
        if #available(iOS 18.0, *) {
            self.matchedTransitionSource(id: id, in: namespace)
        } else {
            self
        }
    }

    /// Applies the zoom navigation transition to a pushed destination.
    @ViewBuilder
    func zoomTransitionDestination(id: some Hashable, namespace: Namespace.ID) -> some View {
        if #available(iOS 18.0, *) {
            self.navigationTransition(.zoom(sourceID: id, in: namespace))
        } else {
            self
        }
    }
}

// MARK: - Status chip

struct StatusChip: View {
    let text: String
    var color: Color = Theme.Colors.amber

    var body: some View {
        Text(text)
            .font(Theme.Typo.label)
            .foregroundStyle(color)
            .padding(.horizontal, Theme.Spacing.sm)
            .padding(.vertical, 5)
            .glassCapsule(tint: color)
    }
}

import SwiftUI

// MARK: - Stamp (styled inked-stamp element)

struct StampView: View {
    let text: String
    var color: Color = Theme.Colors.amber
    var rotation: Double = -4

    var body: some View {
        Text(text.uppercased())
            .font(Theme.Typo.label)
            .kerning(2)
            .foregroundStyle(color)
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.vertical, Theme.Spacing.sm)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .strokeBorder(color, lineWidth: 1.5)
            )
            .rotationEffect(.degrees(rotation))
    }
}

// MARK: - Section eyebrow label

struct EyebrowLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(Theme.Typo.label)
            .kerning(1.5)
            .foregroundStyle(Theme.Colors.amber)
    }
}

// MARK: - Expandable FAQ row

struct FAQRow: View {
    let item: FAQItem
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(Theme.Motion.spring) { expanded.toggle() }
            } label: {
                HStack(alignment: .firstTextBaseline, spacing: Theme.Spacing.sm) {
                    Text(item.question)
                        .font(Theme.Typo.bodyMedium)
                        .foregroundStyle(Theme.Colors.text)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: Theme.Spacing.sm)
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
                Text(item.answer)
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.bottom, Theme.Spacing.md)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
    }
}

// MARK: - Collapsible section (BatchDetail enrichment)

struct CollapsibleSection<Content: View>: View {
    let title: String
    var subtitle: String? = nil
    @State private var expanded = false
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(Theme.Motion.spring) { expanded.toggle() }
            } label: {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(Theme.Typo.h2())
                            .foregroundStyle(Theme.Colors.brandText)
                        if let subtitle {
                            Text(subtitle)
                                .font(Theme.Typo.caption)
                                .foregroundStyle(Theme.Colors.textMuted)
                        }
                    }
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.Colors.amber)
                        .rotationEffect(.degrees(expanded ? 180 : 0))
                }
                .padding(Theme.Spacing.md)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            if expanded {
                content()
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.bottom, Theme.Spacing.md)
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
    }
}

// MARK: - Photo with caption

struct CaptionedPhoto: View {
    let image: ExploreImage
    var height: CGFloat = 240

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            Image(image.name)
                .resizable()
                .scaledToFill()
                .frame(height: height)
                .frame(maxWidth: .infinity)
                .clipped()

            LinearGradient(
                colors: [.clear, .black.opacity(0.65)],
                startPoint: .center, endPoint: .bottom
            )

            Text(image.caption)
                .font(Theme.Typo.caption.weight(.medium))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
                .padding(Theme.Spacing.md)
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
    }
}

// MARK: - Swipeable gallery carousel

struct PhotoGalleryCarousel: View {
    let images: [ExploreImage]
    var height: CGFloat = 260
    @State private var index = 0

    var body: some View {
        VStack(spacing: Theme.Spacing.sm) {
            TabView(selection: $index) {
                ForEach(Array(images.enumerated()), id: \.element.id) { i, image in
                    CaptionedPhoto(image: image, height: height)
                        .tag(i)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: height)

            HStack(spacing: 6) {
                ForEach(0..<images.count, id: \.self) { i in
                    Circle()
                        .fill(i == index ? Theme.Colors.amber : Theme.Colors.stroke)
                        .frame(width: 6, height: 6)
                }
            }
        }
    }
}

// MARK: - Wrapping chip flow

struct ChipFlow: View {
    let chips: [String]
    var color: Color = Theme.Colors.amber

    var body: some View {
        FlowLayout(spacing: Theme.Spacing.sm) {
            ForEach(chips, id: \.self) { chip in
                Text(chip)
                    .font(Theme.Typo.label)
                    .foregroundStyle(color)
                    .padding(.horizontal, Theme.Spacing.sm + 4)
                    .padding(.vertical, 7)
                    .background(color.opacity(0.12), in: Capsule())
            }
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 { x = 0; y += rowHeight + spacing; rowHeight = 0 }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: width == .infinity ? x : width, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX { x = bounds.minX; y += rowHeight + spacing; rowHeight = 0 }
            subview.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

// MARK: - Spring reveal on scroll-in

struct SpringReveal: ViewModifier {
    @State private var revealed = false
    var delay: Double = 0

    func body(content: Content) -> some View {
        content
            .opacity(revealed ? 1 : 0)
            .offset(y: revealed ? 0 : 16)
            .onAppear {
                withAnimation(Theme.Motion.spring.delay(delay)) { revealed = true }
            }
    }
}

extension View {
    func springReveal(delay: Double = 0) -> some View {
        modifier(SpringReveal(delay: delay))
    }
}

// MARK: - Explore hero header (shared page top)

struct ExploreHero: View {
    let eyebrow: String
    let headline: String   // may contain **…** markers
    let sub: String

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            EyebrowLabel(text: eyebrow)
            Text.styled(headline)
                .font(Theme.Typo.hero())
                .foregroundStyle(Theme.Colors.brandText)
                .lineLimit(4)
                .minimumScaleFactor(0.75)
                .fixedSize(horizontal: false, vertical: true)
            Text(sub)
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .springReveal()
    }
}

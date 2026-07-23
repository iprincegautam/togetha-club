import SwiftUI

// Design tokens — values sourced from /design/tokens.json. Keep in sync by hand.
enum Theme {

    // MARK: - Colors

    enum Colors {
        static let forest = Color(hex: 0x1F3A34)
        static let forestDeep = Color(hex: 0x152825)
        static let offWhite = Color(hex: 0xFAF7F2)
        static let amber = Color(hex: 0xE8A13D)
        static let amberSoft = Color(hex: 0xF3C88A)
        static let ink = Color(hex: 0x1A1A18)
        static let inkMuted = Color(hex: 0x6B6F6C)
        static let success = Color(hex: 0x3E7C59)
        static let danger = Color(hex: 0xB8503E)
        static let womenAccent = Color(hex: 0xC46A8A)
        static let surfaceDark = Color(hex: 0x101C19)
        static let cardDark = Color(hex: 0x1B2C28)

        /// App background: off-white in light mode, deep green-black in dark.
        static let background = Color(light: offWhite, dark: surfaceDark)
        /// Card surface.
        static let card = Color(light: .white, dark: cardDark)
        /// Primary text.
        static let text = Color(light: ink, dark: offWhite)
        /// Secondary text.
        static let textMuted = Color(light: inkMuted, dark: Color(hex: 0x9AA5A0))
        /// Brand-forward text (headers on light surfaces).
        static let brandText = Color(light: forest, dark: offWhite)
        /// Subtle separators / strokes.
        static let stroke = Color(light: ink.opacity(0.08), dark: offWhite.opacity(0.1))
    }

    // MARK: - Spacing

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }

    // MARK: - Radii

    enum Radius {
        static let card: CGFloat = 20
        static let button: CGFloat = 14
        static let chip: CGFloat = 999
        static let sheet: CGFloat = 28
    }

    // MARK: - Typography (serif display via New York, sans UI)

    enum Typo {
        /// Display sizes were tuned on a 393pt-wide (6.3") canvas. On narrower
        /// phones / Display Zoom, scale them down proportionally (clamped so
        /// they never shrink past 85% and never grow past design size).
        @MainActor static let displayScale: CGFloat = {
            let referenceWidth: CGFloat = 393
            let width = min(UIScreen.main.bounds.width, UIScreen.main.bounds.height)
            return min(1.0, max(0.85, width / referenceWidth))
        }()

        /// Dynamic Type–relative serif display font: `base` points at the
        /// default (Large) content size, scaled for narrow screens and tracking
        /// the user's Text Size preference from there.
        @MainActor private static func display(_ base: CGFloat, _ weight: Font.Weight, relativeTo style: Font.TextStyle) -> Font {
            .system(size: UIFontMetrics(forTextStyle: uiStyle(for: style)).scaledValue(for: base * displayScale),
                    weight: weight, design: .serif)
        }

        private static func uiStyle(for style: Font.TextStyle) -> UIFont.TextStyle {
            switch style {
            case .largeTitle: return .largeTitle
            case .title: return .title1
            case .title2: return .title2
            case .body: return .body
            case .caption: return .caption1
            case .caption2: return .caption2
            default: return .body
            }
        }

        @MainActor static func hero(_ weight: Font.Weight = .semibold) -> Font {
            display(34, weight, relativeTo: .largeTitle)
        }
        @MainActor static func title(_ weight: Font.Weight = .semibold) -> Font {
            display(28, weight, relativeTo: .title)
        }
        @MainActor static func h2(_ weight: Font.Weight = .semibold) -> Font {
            display(22, weight, relativeTo: .title2)
        }
        static let body = Font.dynamicSystem(base: 16, weight: .regular, relativeTo: .body)
        static let bodyMedium = Font.dynamicSystem(base: 16, weight: .medium, relativeTo: .body)
        static let caption = Font.dynamicSystem(base: 13, weight: .regular, relativeTo: .caption1)
        static let label = Font.dynamicSystem(base: 11, weight: .semibold, relativeTo: .caption2)
    }

    // MARK: - Motion (spring-based only)

    enum Motion {
        static let spring = Animation.spring(response: 0.45, dampingFraction: 0.82)
        static let springSnappy = Animation.spring(response: 0.3, dampingFraction: 0.9)
    }

    // MARK: - Glass (frosted surfaces — layered over AmbientBackground)

    enum Glass {
        /// Subtle tint laid over the frosted material: lifts legibility in light
        /// mode, adds sheen in dark. Kept low so the brand palette still reads.
        static let tint = Color(light: .white.opacity(0.32), dark: .white.opacity(0.06))
        /// Top-left light edge that reads as a glass rim.
        static let highlight = LinearGradient(
            colors: [.white.opacity(0.55), .white.opacity(0.12), .clear],
            startPoint: .topLeading, endPoint: .bottomTrailing
        )
        /// Soft, diffuse drop shadow — glass floats, it doesn't stamp.
        static let shadow = Color.black.opacity(0.07)
    }
}

extension Font {
    /// System font whose point size follows the user's Dynamic Type setting,
    /// anchored to `base` points at the default (Large) content size.
    static func dynamicSystem(base: CGFloat, weight: Font.Weight, relativeTo style: UIFont.TextStyle) -> Font {
        .system(size: UIFontMetrics(forTextStyle: style).scaledValue(for: base), weight: weight)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }

    /// Dynamic color that adapts to light/dark mode.
    init(light: Color, dark: Color) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
}

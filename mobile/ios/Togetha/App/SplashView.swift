import SwiftUI

/// Animated logo splash shown at cold start over forest green.
/// Logo scales up with a spring + subtle pin rotation, mountain glow fades in,
/// then the whole thing scales/masks away (~1.6s). Respects Reduce Motion.
struct SplashView: View {
    let onFinished: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var logoScale: CGFloat = 0.55
    @State private var logoRotation: Double = -14
    @State private var logoOpacity: Double = 0
    @State private var glowOpacity: Double = 0
    @State private var wordmarkOpacity: Double = 0
    @State private var exiting = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Theme.Colors.forest, Theme.Colors.forestDeep],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // Mountain silhouette glow behind the pin.
            MountainSilhouette()
                .fill(Color.white.opacity(0.06))
                .frame(height: 220)
                .frame(maxHeight: .infinity, alignment: .bottom)
                .opacity(glowOpacity)
                .ignoresSafeArea()

            VStack(spacing: Theme.Spacing.lg) {
                Image("Logo")
                    .renderingMode(.template)
                    .resizable()
                    .scaledToFit()
                    .foregroundStyle(Theme.Colors.offWhite)
                    .frame(width: 128, height: 128)
                    .scaleEffect(logoScale)
                    .rotationEffect(.degrees(logoRotation))
                    .opacity(logoOpacity)
                    .shadow(color: .black.opacity(0.3), radius: 18, y: 8)

                VStack(spacing: Theme.Spacing.xs) {
                    Text("TOGETHA.CLUB")
                        .font(Theme.Typo.label)
                        .kerning(3)
                        .foregroundStyle(Theme.Colors.amber)
                    Text("India's first matchmaking travel club.")
                        .font(Theme.Typo.h2())
                        .foregroundStyle(Theme.Colors.offWhite)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, Theme.Spacing.lg)
                }
                .opacity(wordmarkOpacity)
            }
        }
        .scaleEffect(exiting ? 1.12 : 1)
        .opacity(exiting ? 0 : 1)
        .onAppear(perform: run)
        .accessibilityHidden(true)
    }

    private func run() {
        if reduceMotion {
            logoScale = 1; logoRotation = 0; logoOpacity = 1; glowOpacity = 1; wordmarkOpacity = 1
            Task {
                try? await Task.sleep(nanoseconds: 900_000_000)
                withAnimation(.easeOut(duration: 0.25)) { exiting = true }
                try? await Task.sleep(nanoseconds: 260_000_000)
                onFinished()
            }
            return
        }

        withAnimation(.spring(response: 0.6, dampingFraction: 0.65)) {
            logoScale = 1
            logoRotation = 0
            logoOpacity = 1
        }
        withAnimation(.easeOut(duration: 0.6).delay(0.35)) { glowOpacity = 1 }
        withAnimation(.easeOut(duration: 0.45).delay(0.5)) { wordmarkOpacity = 1 }

        Task {
            try? await Task.sleep(nanoseconds: 1_250_000_000)
            withAnimation(.spring(response: 0.4, dampingFraction: 0.9)) { exiting = true }
            try? await Task.sleep(nanoseconds: 350_000_000)
            onFinished()
        }
    }
}

/// Simple mountain-range silhouette used as the splash backdrop.
struct MountainSilhouette: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let w = rect.width, h = rect.height
        p.move(to: CGPoint(x: 0, y: h))
        p.addLine(to: CGPoint(x: 0, y: h * 0.65))
        p.addLine(to: CGPoint(x: w * 0.2, y: h * 0.25))
        p.addLine(to: CGPoint(x: w * 0.35, y: h * 0.55))
        p.addLine(to: CGPoint(x: w * 0.55, y: h * 0.1))
        p.addLine(to: CGPoint(x: w * 0.72, y: h * 0.5))
        p.addLine(to: CGPoint(x: w * 0.88, y: h * 0.3))
        p.addLine(to: CGPoint(x: w, y: h * 0.6))
        p.addLine(to: CGPoint(x: w, y: h))
        p.closeSubpath()
        return p
    }
}

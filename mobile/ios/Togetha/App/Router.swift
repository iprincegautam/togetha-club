import SwiftUI

struct RootView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.api) private var api
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @State private var showSplash = true

    /// Explicit phase machine so mid-flow state flips (e.g. quizCompleted set while
    /// the result screen is still up) never tear down the current screen.
    private enum Phase { case onboarding, auth, quiz, main }
    @State private var phase: Phase?

    var body: some View {
        ZStack {
            switch phase {
            case .onboarding:
                OnboardingView { advance(after: .onboarding) }
            case .auth:
                AuthView { advance(after: .auth) }
            case .quiz:
                QuizView(
                    batch: MockAPIClient.batches.first { !$0.isWaitlistOnly } ?? MockAPIClient.batches[0],
                    isMandatory: true,
                    onFinished: { advance(after: .quiz) }
                )
            case .main:
                MainTabView()
            case nil:
                Theme.Colors.background.ignoresSafeArea()
            }

            if showSplash {
                SplashView {
                    withAnimation(.easeOut(duration: 0.2)) { showSplash = false }
                }
                .transition(.opacity)
                .zIndex(10)
            }
        }
        .onAppear {
            if phase == nil { phase = initialPhase }
        }
    }

    /// Returning users (signed in + quiz done) go straight to tabs.
    private var initialPhase: Phase {
        if !hasSeenOnboarding { return .onboarding }
        if !appState.signedIn { return .auth }
        if !appState.quizCompleted { return .quiz }
        return .main
    }

    private func advance(after finished: Phase) {
        withAnimation(Theme.Motion.spring) {
            switch finished {
            case .onboarding:
                hasSeenOnboarding = true
                phase = !appState.signedIn ? .auth : (appState.quizCompleted ? .main : .quiz)
            case .auth:
                appState.signedIn = true
                Task { await gateAfterAuth() }
            case .quiz, .main:
                phase = .main
            }
        }
    }

    /// After sign-in, gate the quiz on the LOGGED-IN user's real status (their
    /// applicant's quiz_score) rather than a device-wide flag — so a returning
    /// (or website) user who already did the quiz skips it, and a genuinely new
    /// user is asked. Mock/unauthed sign-in falls back to the device flag.
    private func gateAfterAuth() async {
        if let app = try? await api.fetchApplication() {
            appState.application = app
            if app.quizTaken { appState.quizCompleted = true }
        }
        withAnimation(Theme.Motion.spring) {
            phase = appState.quizCompleted ? .main : .quiz
        }
    }
}

enum AppTab: Int, CaseIterable {
    case discover, feed, journey, chats, account
}

struct MainTabView: View {
    @State private var showTia = false
    @State private var selectedTab: AppTab = .discover
    @State private var hideTiaButton = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.api) private var api
    @Environment(AppState.self) private var appState

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            TabView(selection: $selectedTab) {
                tabContent(DiscoverView(), tab: .discover)
                    .tabItem { Label("Discover", systemImage: "safari") }
                    .tag(AppTab.discover)
                tabContent(FeedView(), tab: .feed)
                    .tabItem { Label("Feed", systemImage: "photo.on.rectangle.angled") }
                    .tag(AppTab.feed)
                tabContent(JourneyView(), tab: .journey)
                    .tabItem { Label("Journey", systemImage: "point.topleft.down.to.point.bottomright.curvepath") }
                    .tag(AppTab.journey)
                tabContent(CommunityView(), tab: .chats)
                    .tabItem { Label("Chats", systemImage: "bubble.left.and.bubble.right") }
                    .tag(AppTab.chats)
                tabContent(AccountView(), tab: .account)
                    .tabItem { Label("Account", systemImage: "person.crop.circle") }
                    .tag(AppTab.account)
            }
            .onPreferenceChange(HideTiaButtonKey.self) { hideTiaButton = $0 }

            if !hideTiaButton {
                tiaButton
                    .transition(.scale.combined(with: .opacity))
            }
        }
        .animation(Theme.Motion.springSnappy, value: hideTiaButton)
        .task {
            // Hydrate the real application for a signed-in user (no-op on mock).
            if appState.application == nil, let app = try? await api.fetchApplication() {
                withAnimation(Theme.Motion.spring) { appState.application = app }
            }
        }
        .sheet(isPresented: $showTia) {
            TiaChatView()
                .presentationDetents([.medium, .large])
                .presentationCornerRadius(Theme.Radius.sheet)
                .presentationBackground(.ultraThinMaterial)
                .presentationBackgroundInteraction(.disabled)
        }
    }

    /// Tab switches cross-fade with a slight y-offset spring.
    @ViewBuilder
    private func tabContent(_ view: some View, tab: AppTab) -> some View {
        TabTransitionContainer(isActive: selectedTab == tab, reduceMotion: reduceMotion) {
            view
        }
    }

    private var tiaButton: some View {
        Button {
            showTia = true
        } label: {
            ZStack {
                Circle()
                    .fill(.ultraThinMaterial)
                    .overlay(Circle().fill(Theme.Colors.forest.opacity(0.62)))
                    .overlay(Circle().strokeBorder(Theme.Glass.highlight, lineWidth: 1))
                    .frame(width: 56, height: 56)
                    .shadow(color: Theme.Glass.shadow, radius: 12, y: 6)
                Image(systemName: "sparkles")
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(Theme.Colors.amber)
            }
        }
        .buttonStyle(SpringPressStyle())
        .accessibilityLabel("Chat with Tia, your Togetha concierge")
        .padding(.trailing, Theme.Spacing.lg)
        .padding(.bottom, 72)
    }
}

/// Cross-fade + slight y-offset spring whenever a tab becomes active.
private struct TabTransitionContainer<Content: View>: View {
    let isActive: Bool
    let reduceMotion: Bool
    @ViewBuilder let content: () -> Content

    @State private var appeared = false

    var body: some View {
        content()
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared || reduceMotion ? 0 : 12)
            .onChange(of: isActive) { _, active in
                if active {
                    appeared = false
                    withAnimation(Theme.Motion.spring) { appeared = true }
                } else {
                    appeared = false
                }
            }
            .onAppear {
                if isActive { withAnimation(Theme.Motion.spring) { appeared = true } }
            }
    }
}

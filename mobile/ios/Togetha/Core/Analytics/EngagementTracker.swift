import Foundation
import SwiftUI

/// Lightweight engagement analytics. One session ID per install-session;
/// events flush through `APIClientProtocol.trackEvents` (console in mock,
/// POST /track-event live).
@MainActor
final class EngagementTracker {
    static let shared = EngagementTracker()

    let sessionId = UUID().uuidString
    private var api: any APIClientProtocol = MockAPIClient()
    private var screenStarts: [String: Date] = [:]

    func configure(api: any APIClientProtocol) {
        self.api = api
    }

    // MARK: - Screen dwell

    func screenAppeared(_ name: String) {
        screenStarts[name] = .now
    }

    func screenDisappeared(_ name: String) {
        guard let start = screenStarts.removeValue(forKey: name) else { return }
        let dwell = Date.now.timeIntervalSince(start)
        send(EngagementEvent(
            name: "screen_view", sessionId: sessionId, timestamp: .now,
            screen: name, dwellSeconds: (dwell * 10).rounded() / 10
        ))
    }

    // MARK: - Discrete events

    func listingView(batchId: String) {
        send(EngagementEvent(name: "listing_view", sessionId: sessionId, timestamp: .now, batchId: batchId))
    }

    func listingClick(batchId: String) {
        send(EngagementEvent(name: "listing_click", sessionId: sessionId, timestamp: .now, batchId: batchId))
    }

    func applyStart(batchId: String) {
        send(EngagementEvent(name: "apply_start", sessionId: sessionId, timestamp: .now, batchId: batchId))
    }

    func quizStart(batchId: String?) {
        send(EngagementEvent(name: "quiz_start", sessionId: sessionId, timestamp: .now, batchId: batchId))
    }

    private func send(_ event: EngagementEvent) {
        let api = self.api
        Task { try? await api.trackEvents([event]) }
    }
}

// MARK: - View helper

private struct TrackScreenModifier: ViewModifier {
    let name: String

    func body(content: Content) -> some View {
        content
            .onAppear { EngagementTracker.shared.screenAppeared(name) }
            .onDisappear { EngagementTracker.shared.screenDisappeared(name) }
    }
}

extension View {
    /// Records a `screen_view` event with dwell seconds for this screen.
    func trackScreen(_ name: String) -> some View {
        modifier(TrackScreenModifier(name: name))
    }
}

import SwiftUI

struct TiaChatView: View {
    @Environment(\.api) private var api
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    @State private var messages: [ChatMessage] = [
        ChatMessage(role: .tia, text: "Hi, I'm Tia — your Togetha concierge. I can check your booking, list upcoming Friday departures, pull up your queries, or explain how screening works.")
    ]
    @State private var draft = ""
    @State private var isTyping = false

    private let chips = ["My booking status", "Upcoming departures", "How screening works", "My queries"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: Theme.Spacing.sm) {
                            ForEach(messages) { message in
                                bubble(message)
                                    .id(message.id)
                                    .transition(.move(edge: .bottom).combined(with: .opacity))
                            }
                            if isTyping {
                                HStack {
                                    Text("Tia is typing…")
                                        .font(Theme.Typo.caption)
                                        .foregroundStyle(Theme.Colors.textMuted)
                                        .padding(Theme.Spacing.sm)
                                    Spacer()
                                }
                                .id("typing")
                            }
                        }
                        .padding(Theme.Spacing.md)
                    }
                    .onChange(of: messages.count) {
                        withAnimation(Theme.Motion.spring) {
                            proxy.scrollTo(messages.last?.id, anchor: .bottom)
                        }
                    }
                }

                chipRow

                Text("Tia is read-only and can't promise approvals — screening is human.")
                    .font(Theme.Typo.label)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .padding(.bottom, Theme.Spacing.xs)

                inputBar
            }
            .background { AmbientBackground() }
            .navigationTitle("Tia")
            .navigationBarTitleDisplayMode(.inline)
            .trackScreen("Tia")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(Theme.Colors.textMuted)
                }
            }
        }
    }

    private var chipRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Spacing.sm) {
                ForEach(chips, id: \.self) { chip in
                    Button {
                        send(chip)
                    } label: {
                        Text(chip)
                            .font(Theme.Typo.caption.weight(.medium))
                            .foregroundStyle(Theme.Colors.brandText)
                            .padding(.horizontal, Theme.Spacing.md)
                            .padding(.vertical, Theme.Spacing.sm)
                            .background(Theme.Colors.card, in: Capsule())
                            .overlay(Capsule().strokeBorder(Theme.Colors.amber.opacity(0.5)))
                    }
                    .buttonStyle(SpringPressStyle())
                    .disabled(isTyping)
                }
            }
            .padding(.horizontal, Theme.Spacing.md)
        }
        .padding(.vertical, Theme.Spacing.sm)
    }

    private func bubble(_ message: ChatMessage) -> some View {
        HStack {
            if message.role == .user { Spacer(minLength: Theme.Spacing.xxl) }
            Text(message.text)
                .font(Theme.Typo.body)
                .foregroundStyle(message.role == .user ? Theme.Colors.offWhite : Theme.Colors.text)
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.vertical, Theme.Spacing.sm + 2)
                .background(
                    message.role == .user ? Theme.Colors.forest : Theme.Colors.card,
                    in: RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.card)
                        .strokeBorder(message.role == .user ? Color.clear : Theme.Colors.stroke)
                )
            if message.role == .tia { Spacer(minLength: Theme.Spacing.xxl) }
        }
        .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)
    }

    private var inputBar: some View {
        HStack(spacing: Theme.Spacing.sm) {
            TextField("Ask Tia anything…", text: $draft, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.vertical, Theme.Spacing.sm + 2)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.chip))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.chip).strokeBorder(Theme.Colors.stroke))

            Button {
                send(draft)
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.Colors.ink)
                    .frame(width: 38, height: 38)
                    .background(Theme.Colors.amber, in: Circle())
            }
            .buttonStyle(SpringPressStyle())
            .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty || isTyping)
            .accessibilityLabel("Send message")
        }
        .padding(Theme.Spacing.md)
    }

    private func send(_ raw: String) {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isTyping else { return }
        draft = ""
        withAnimation(Theme.Motion.spring) {
            messages.append(ChatMessage(role: .user, text: text))
            isTyping = true
        }
        let context = TiaContext(
            application: appState.application,
            queries: appState.queries,
            balanceDue: appState.application.flatMap { app in
                MockAPIClient.batches.first { $0.id == app.batchId }?.balanceAmount
            }
        )
        Task {
            let reply = try? await api.sendTiaMessage(messages: messages, context: context)
            withAnimation(Theme.Motion.spring) {
                isTyping = false
                if let reply { messages.append(reply) }
            }
        }
    }
}

import SwiftUI

// MARK: - Groups list

struct CommunityView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                        Text("Community")
                            .font(Theme.Typo.hero())
                            .foregroundStyle(Theme.Colors.brandText)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        Text("Interested groups are open to applicants. Travelers groups unlock automatically once your deposit is in.")
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.top, Theme.Spacing.md)

                    safetyBanner

                    if appState.groups.isEmpty && !hasDeposit {
                        // Visitors see the Travelers group is ALIVE but locked —
                        // a curiosity device to convert visitor → deposit.
                        lockedTravelersTeaser(for: teaserBatch)
                    } else if appState.groups.isEmpty {
                        emptyState
                    } else {
                        ForEach(appState.groups) { group in
                            NavigationLink(value: group.id) {
                                GroupRow(group: group)
                            }
                            .buttonStyle(SpringPressStyle())
                        }
                        if !hasDeposit {
                            lockedTravelersTeaser(for: teaserBatch)
                        }
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.bottom, Theme.Spacing.xxl * 2)
            }
            .background { AmbientBackground() }
            .toolbar(.hidden, for: .navigationBar)
            .trackScreen("Community")
            .navigationDestination(for: String.self) { groupId in
                GroupChatView(groupId: groupId)
            }
            .animation(Theme.Motion.spring, value: appState.groups.count)
        }
    }

    /// Explains the safety-first gating so the mixed locked/open state reads as
    /// intentional, not broken.
    private var safetyBanner: some View {
        HStack(alignment: .top, spacing: Theme.Spacing.sm) {
            Image(systemName: "lock.shield.fill")
                .font(.system(size: 18))
                .foregroundStyle(Theme.Colors.success)
            Text("We keep chat safe for everyone. Interested groups open when you apply — the Travelers group and full chat unlock once your profile is approved and your deposit is in, so every person in the room is verified.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .glassCard(stroke: Theme.Colors.success)
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("No groups yet")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.text)
            Text("Apply for a batch and its Interested group opens up here. Pay your deposit and you're pulled into the Travelers group automatically.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
        }
    }

    // MARK: - Curiosity gate

    /// Deposit paid → real Travelers access. Until then, only the locked glimpse.
    private var hasDeposit: Bool { appState.application?.depositPaid == true }

    /// The batch whose Travelers group we tease — the one they applied to, else flagship.
    private var teaserBatch: Batch {
        if let id = appState.application?.batchId,
           let b = MockAPIClient.batches.first(where: { $0.id == id }) { return b }
        return MockAPIClient.batches.first { !$0.isWaitlistOnly } ?? MockAPIClient.batches[0]
    }

    private let teaserPreviews: [(String, String)] = [
        ("Ananya", "just paid my deposit — counting down to Kasol already 🏔️"),
        ("Rohan", "anyone else on the Aug 21 Friday departure?"),
        ("Togetha Crew", "packing list + boarding point drop here first. welcome 👋")
    ]

    /// The Travelers group, shown ALIVE but locked. Blurred glimpse + deposit CTA —
    /// this is the visitor→customer curiosity hook.
    private func lockedTravelersTeaser(for batch: Batch) -> some View {
        let inside = max(6, batch.womenCount + batch.menCount)
        return VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            HStack(spacing: Theme.Spacing.sm) {
                ZStack {
                    Circle().fill(Theme.Colors.forest)
                    Image(systemName: "lock.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(Theme.Colors.amber)
                }
                .frame(width: 48, height: 48)
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(batch.name.components(separatedBy: " — ").first ?? batch.name) · Travelers")
                        .font(Theme.Typo.bodyMedium)
                        .foregroundStyle(Theme.Colors.text)
                    Text("\(inside) already inside · \(batch.womenCount) women · \(batch.menCount) men, talking now")
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.womenAccent)
                }
                Spacer()
            }

            ZStack {
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    ForEach(teaserPreviews, id: \.0) { name, text in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(name)
                                .font(Theme.Typo.label)
                                .foregroundStyle(Theme.Colors.womenAccent)
                            Text(text)
                                .font(Theme.Typo.caption)
                                .foregroundStyle(Theme.Colors.text)
                        }
                        .padding(Theme.Spacing.sm)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                    }
                }
                .blur(radius: 7)
                .allowsHitTesting(false)
                .accessibilityHidden(true)

                VStack(spacing: Theme.Spacing.xs) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(Theme.Colors.forest)
                    Text("The Travelers group is already talking.")
                        .font(Theme.Typo.bodyMedium)
                        .foregroundStyle(Theme.Colors.text)
                        .multilineTextAlignment(.center)
                    Text("Reserve your slot with a deposit — you're pulled in the moment it clears.")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(Theme.Spacing.md)
            }
        }
        .padding(Theme.Spacing.md)
        .glassCard()
    }
}

private struct GroupRow: View {
    let group: ChatGroup

    var body: some View {
        HStack(spacing: Theme.Spacing.md) {
            ZStack {
                Circle().fill(group.kind == .travelers ? Theme.Colors.forest : Theme.Colors.amberSoft.opacity(0.4))
                Image(systemName: group.kind == .travelers ? "checkmark.seal.fill" : "hand.wave.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(group.kind == .travelers ? Theme.Colors.amber : Theme.Colors.forest)
            }
            .frame(width: 48, height: 48)

            VStack(alignment: .leading, spacing: 2) {
                Text(group.name)
                    .font(Theme.Typo.bodyMedium)
                    .foregroundStyle(Theme.Colors.text)
                    .multilineTextAlignment(.leading)
                Text(group.messages.last.map { "\($0.senderName): \($0.text)" } ?? "No messages yet")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .lineLimit(1)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                StatusChip(
                    text: group.kind == .travelers ? "Travelers" : "Interested",
                    color: group.kind == .travelers ? Theme.Colors.success : Theme.Colors.amber
                )
                Text("\(group.memberCount) members")
                    .font(Theme.Typo.label)
                    .foregroundStyle(Theme.Colors.textMuted)
            }
        }
        .padding(Theme.Spacing.md)
        .glassCard()
        .transition(.move(edge: .top).combined(with: .opacity))
    }
}

// MARK: - Group chat

struct GroupChatView: View {
    let groupId: String
    @Environment(AppState.self) private var appState
    @State private var draft = ""

    private var group: ChatGroup? {
        appState.groups.first { $0.id == groupId }
    }

    var body: some View {
        VStack(spacing: 0) {
            if let group {
                if group.kind == .travelers {
                    travelersBanner
                }

                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: Theme.Spacing.sm) {
                            ForEach(sections(of: group.messages), id: \.day) { section in
                                daySeparator(section.day)
                                ForEach(section.messages) { message in
                                    bubble(message)
                                        .id(message.id)
                                        .transition(.move(edge: .bottom).combined(with: .opacity))
                                }
                            }
                        }
                        .padding(Theme.Spacing.md)
                    }
                    .onChange(of: group.messages.count) {
                        withAnimation(Theme.Motion.spring) {
                            proxy.scrollTo(group.messages.last?.id, anchor: .bottom)
                        }
                    }
                    .onAppear {
                        proxy.scrollTo(group.messages.last?.id, anchor: .bottom)
                    }
                }

                inputBar
            }
        }
        .background { AmbientBackground() }
        .navigationTitle(group?.name ?? "Chat")
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("GroupChat:\(groupId)")
    }

    private var travelersBanner: some View {
        HStack(spacing: Theme.Spacing.sm) {
            Image(systemName: "checkmark.seal.fill")
                .foregroundStyle(Theme.Colors.amber)
            Text("You're in — everyone here has paid their deposit.")
                .font(Theme.Typo.caption.weight(.medium))
                .foregroundStyle(Theme.Colors.offWhite)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.Spacing.sm)
        .background(Theme.Colors.forest)
    }

    // MARK: Day sections

    private struct DaySection {
        let day: String
        let messages: [GroupMessage]
    }

    private func sections(of messages: [GroupMessage]) -> [DaySection] {
        let grouped = Dictionary(grouping: messages) { msg in
            Calendar.current.startOfDay(for: msg.sentAt)
        }
        return grouped.keys.sorted().map { day in
            DaySection(
                day: day.formatted(date: .abbreviated, time: .omitted),
                messages: (grouped[day] ?? []).sorted { $0.sentAt < $1.sentAt }
            )
        }
    }

    private func daySeparator(_ text: String) -> some View {
        HStack {
            Rectangle().fill(Theme.Colors.stroke).frame(height: 1)
            Text(text)
                .font(Theme.Typo.label)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize()
            Rectangle().fill(Theme.Colors.stroke).frame(height: 1)
        }
        .padding(.vertical, Theme.Spacing.xs)
    }

    private func bubble(_ message: GroupMessage) -> some View {
        HStack {
            if message.isOwn { Spacer(minLength: Theme.Spacing.xxl) }
            VStack(alignment: message.isOwn ? .trailing : .leading, spacing: 3) {
                if !message.isOwn {
                    Text(message.senderName)
                        .font(Theme.Typo.label)
                        .foregroundStyle(message.senderName == "Togetha Crew" ? Theme.Colors.amber : Theme.Colors.womenAccent)
                } else if appState.isVerified {
                    // ✓ Verified badge next to the user's name — badge only, never documents.
                    HStack(spacing: 3) {
                        Text("You")
                            .font(Theme.Typo.label)
                            .foregroundStyle(Theme.Colors.offWhite.opacity(0.7))
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.Colors.amberSoft)
                            .accessibilityLabel("Verified")
                    }
                }
                Text(message.text)
                    .font(Theme.Typo.body)
                    .foregroundStyle(message.isOwn ? Theme.Colors.offWhite : Theme.Colors.text)
                Text(message.sentAt.formatted(date: .omitted, time: .shortened))
                    .font(.system(size: 9))
                    .foregroundStyle(message.isOwn ? Theme.Colors.offWhite.opacity(0.6) : Theme.Colors.textMuted)
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.vertical, Theme.Spacing.sm + 2)
            .background(
                message.isOwn ? Theme.Colors.forest : Theme.Colors.card,
                in: RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.card)
                    .strokeBorder(message.isOwn ? Color.clear : Theme.Colors.stroke)
            )
            if !message.isOwn { Spacer(minLength: Theme.Spacing.xxl) }
        }
        .frame(maxWidth: .infinity, alignment: message.isOwn ? .trailing : .leading)
    }

    private var inputBar: some View {
        HStack(spacing: Theme.Spacing.sm) {
            TextField("Message the group…", text: $draft, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.vertical, Theme.Spacing.sm + 2)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.chip))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.chip).strokeBorder(Theme.Colors.stroke))

            Button {
                let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !text.isEmpty else { return }
                draft = ""
                withAnimation(Theme.Motion.spring) {
                    appState.sendGroupMessage(groupId: groupId, text: text)
                }
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.Colors.ink)
                    .frame(width: 38, height: 38)
                    .background(Theme.Colors.amber, in: Circle())
            }
            .buttonStyle(SpringPressStyle())
            .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
            .accessibilityLabel("Send message")
        }
        .padding(Theme.Spacing.md)
    }
}

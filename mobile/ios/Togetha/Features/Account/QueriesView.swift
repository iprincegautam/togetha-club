import SwiftUI

/// "My queries & feedback" — list + submit new.
struct QueriesView: View {
    @Environment(AppState.self) private var appState
    @State private var showNew = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                if appState.queries.isEmpty {
                    Text("Nothing yet. Questions, complaints, love letters — all welcome.")
                        .font(Theme.Typo.body)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .padding(.top, Theme.Spacing.lg)
                } else {
                    ForEach(appState.queries) { query in
                        QueryRow(query: query)
                    }
                }
            }
            .padding(Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .hidesTiaButton()
        .navigationTitle("My queries & feedback")
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("Queries")
        .safeAreaInset(edge: .bottom) {
            PrimaryButton(title: "New query or feedback", systemImage: "plus") {
                showNew = true
            }
            .padding(Theme.Spacing.md)
            .background(.ultraThinMaterial)
        }
        .sheet(isPresented: $showNew) {
            NewQuerySheet()
                .presentationDetents([.medium, .large])
                .presentationCornerRadius(Theme.Radius.sheet)
        }
        .animation(Theme.Motion.spring, value: appState.queries.count)
    }
}

private struct QueryRow: View {
    let query: UserQuery

    private var statusColor: Color {
        switch query.status {
        case .open: Theme.Colors.amber
        case .inProgress: Theme.Colors.womenAccent
        case .resolved: Theme.Colors.success
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                StatusChip(text: query.kind, color: Theme.Colors.textMuted)
                Spacer()
                StatusChip(text: query.status.label, color: statusColor)
            }
            Text(query.subject)
                .font(Theme.Typo.bodyMedium)
                .foregroundStyle(Theme.Colors.text)
            Text(query.detail)
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            Text(query.createdAt.formatted(date: .abbreviated, time: .omitted))
                .font(Theme.Typo.label)
                .foregroundStyle(Theme.Colors.textMuted)
        }
        .padding(Theme.Spacing.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
        .transition(.move(edge: .top).combined(with: .opacity))
    }
}

private struct NewQuerySheet: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var kind = "Query"
    @State private var subject = ""
    @State private var detail = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    Picker("Type", selection: $kind) {
                        Text("Query").tag("Query")
                        Text("Feedback").tag("Feedback")
                    }
                    .pickerStyle(.segmented)

                    TextField("Subject", text: $subject)
                        .padding(Theme.Spacing.md)
                        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))

                    TextField("Tell us more…", text: $detail, axis: .vertical)
                        .lineLimit(4...8)
                        .padding(Theme.Spacing.md)
                        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))

                    PrimaryButton(title: "Submit") {
                        appState.submitQuery(kind: kind, subject: subject, detail: detail)
                        dismiss()
                    }
                    .disabled(subject.trimmingCharacters(in: .whitespaces).isEmpty)

                    Text("Support hours: Mon–Sat, 10 AM–7 PM IST · WhatsApp +91 70541 83391")
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.textMuted)
                }
                .padding(Theme.Spacing.md)
            }
            .background { AmbientBackground() }
            .navigationTitle("New \(kind.lowercased())")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Theme.Colors.textMuted)
                }
            }
        }
    }
}

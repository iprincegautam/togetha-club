import SwiftUI

/// Complete-profile / KYC form. Submitting sets kycStatus = .submitted in mock.
struct KycView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var form = KycProfile()
    @State private var submitted = false

    private var canSubmit: Bool {
        !form.bio.trimmingCharacters(in: .whitespaces).isEmpty
            && !form.city.trimmingCharacters(in: .whitespaces).isEmpty
            && !form.emergencyContact.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                    if submitted {
                        successState
                    } else {
                        Text("Reviewers read this before your decision — the more real, the faster.")
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)

                        labeled("Short bio") {
                            TextField("Who are you, honestly?", text: $form.bio, axis: .vertical)
                                .lineLimit(3...6)
                        }
                        labeled("City") {
                            TextField("Where you live", text: $form.city)
                        }
                        labeled("Emergency contact") {
                            TextField("Name + phone number", text: $form.emergencyContact)
                        }
                        labeled("Dietary notes") {
                            TextField("Veg / allergies / anything we should know", text: $form.dietaryNotes)
                        }
                        labeled("Instagram handle") {
                            TextField("@you (optional)", text: $form.instagramHandle)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }

                        PrimaryButton(title: "Submit for review") {
                            appState.kycProfile = form
                            appState.submitKyc()
                            withAnimation(Theme.Motion.spring) { submitted = true }
                        }
                        .disabled(!canSubmit)
                        .padding(.top, Theme.Spacing.sm)
                    }
                }
                .padding(Theme.Spacing.md)
            }
            .scrollDismissesKeyboard(.interactively)
            .background { AmbientBackground() }
            .navigationTitle("Complete profile")
            .navigationBarTitleDisplayMode(.inline)
            .trackScreen("KYC")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(Theme.Colors.textMuted)
                }
            }
            .onAppear { form = appState.kycProfile }
        }
    }

    private var successState: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 44))
                .foregroundStyle(Theme.Colors.success)
            Text("Profile submitted")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
            Text("It's now with the review team, alongside your quiz and application. You'll hear back within 24–36 hours.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
            PrimaryButton(title: "Done") { dismiss() }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.Spacing.xxl)
    }

    private func labeled(_ label: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(label).font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
            content()
                .padding(Theme.Spacing.md)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
        }
    }
}

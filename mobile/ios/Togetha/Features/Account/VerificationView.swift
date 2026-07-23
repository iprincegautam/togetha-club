import SwiftUI
import PhotosUI

/// "Get verified ✓" — mock verification form. Nothing leaves the device in this
/// build; on submit the status flips to `.submitted` and a real person reviews.
struct VerificationView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var linkedIn = ""
    @State private var instagram = ""
    @State private var company = ""
    @State private var idLast4 = ""
    @State private var panMasked = ""
    @State private var idPhotoItem: PhotosPickerItem?
    @State private var idPhotoPicked = false
    @State private var submitting = false

    private var canSubmit: Bool {
        !linkedIn.trimmingCharacters(in: .whitespaces).isEmpty
            && !company.trimmingCharacters(in: .whitespaces).isEmpty
            && idLast4.count == 4
            && panMasked.count == 10
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    switch appState.verificationStatus {
                    case .notStarted, .rejected:
                        form
                    case .submitted:
                        submittedState
                    case .verified:
                        verifiedState
                    }
                }
                .padding(Theme.Spacing.md)
                .padding(.bottom, Theme.Spacing.xxl)
            }
            .scrollDismissesKeyboard(.interactively)
            .background { AmbientBackground() }
            .navigationTitle("Get verified ✓")
            .navigationBarTitleDisplayMode(.inline)
            .trackScreen("Verification")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(Theme.Colors.textMuted)
                }
            }
            .animation(Theme.Motion.spring, value: appState.verificationStatus)
        }
    }

    // MARK: - Form

    private var form: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("Verify your profile")
                    .font(Theme.Typo.title())
                    .foregroundStyle(Theme.Colors.brandText)
                Text("A ✓ Verified badge shows next to your name across the club — your documents never do.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if appState.verificationStatus == .rejected {
                Text("Our reviewer couldn't verify your last submission. Check the details and try again.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.danger)
            }

            field("LinkedIn URL", text: $linkedIn, placeholder: "linkedin.com/in/you", keyboard: .URL)
            field("Instagram handle", text: $instagram, placeholder: "@yourhandle")
            field("Work / company name", text: $company, placeholder: "Where you work")

            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("Government ID — last 4 digits")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                TextField("1234", text: $idLast4)
                    .keyboardType(.numberPad)
                    .padding(Theme.Spacing.md)
                    .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
                    .onChange(of: idLast4) { _, new in
                        idLast4 = String(new.filter(\.isNumber).prefix(4))
                    }
            }

            PhotosPicker(selection: $idPhotoItem, matching: .images) {
                HStack(spacing: Theme.Spacing.sm) {
                    Image(systemName: idPhotoPicked ? "checkmark.circle.fill" : "doc.viewfinder")
                        .foregroundStyle(idPhotoPicked ? Theme.Colors.success : Theme.Colors.amber)
                    Text(idPhotoPicked ? "ID photo attached" : "Upload a photo of your ID")
                        .font(Theme.Typo.body)
                        .foregroundStyle(Theme.Colors.text)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.Colors.textMuted)
                }
                .padding(Theme.Spacing.md)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
            }
            .onChange(of: idPhotoItem) { _, new in
                if new != nil {
                    withAnimation(Theme.Motion.springSnappy) { idPhotoPicked = true }
                }
            }

            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("PAN (masked as you type)")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                TextField("XXXXX123X", text: $panMasked)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .padding(Theme.Spacing.md)
                    .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                    .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
                    .onChange(of: panMasked) { _, new in
                        panMasked = Self.maskPAN(new)
                    }
            }

            HStack(alignment: .top, spacing: Theme.Spacing.sm) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.Colors.success)
                Text("Used only to verify you — never shared, never public.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            PrimaryButton(title: "Submit for verification", isLoading: submitting) {
                submitting = true
                Task {
                    try? await Task.sleep(nanoseconds: 800_000_000)
                    submitting = false
                    withAnimation(Theme.Motion.spring) {
                        appState.verificationStatus = .submitted
                    }
                }
            }
            .disabled(!canSubmit)
            .opacity(canSubmit ? 1 : 0.55)
        }
    }

    /// PAN format AAAAA1234A → letters masked as they're typed: XXXXX123X style.
    static func maskPAN(_ raw: String) -> String {
        let chars = Array(raw.uppercased().filter { $0.isLetter || $0.isNumber }.prefix(10))
        return String(chars.enumerated().map { i, c in
            switch i {
            case 0...4, 9: return Character("X")
            default: return c
            }
        })
    }

    // MARK: - States

    private var submittedState: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Image(systemName: "hourglass")
                .font(.system(size: 40))
                .foregroundStyle(Theme.Colors.amber)
                .padding(.top, Theme.Spacing.xl)
            Text("Your file is in.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
            Text("A real person reviews your file — 24–36 hours.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)

            #if DEBUG
            // Debug-only control so the demo can walk the flow without a backend.
            Button {
                withAnimation(Theme.Motion.spring) { appState.verificationStatus = .verified }
            } label: {
                Label("Demo: simulate reviewer approval", systemImage: "wand.and.stars")
                    .font(Theme.Typo.label)
                    .foregroundStyle(Theme.Colors.textMuted)
            }
            #endif
        }
        .frame(maxWidth: .infinity)
    }

    private var verifiedState: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 44))
                .foregroundStyle(Theme.Colors.success)
                .padding(.top, Theme.Spacing.xl)
            Text("You're verified.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
            Text("The ✓ badge now shows next to your name in the feed, chats, and your account. Only the badge is public — never your documents.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
            PrimaryButton(title: "Done") { dismiss() }
        }
        .frame(maxWidth: .infinity)
    }

    private func field(_ label: String, text: Binding<String>, placeholder: String, keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text(label).font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
            TextField(placeholder, text: text)
                .keyboardType(keyboard)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(Theme.Spacing.md)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
        }
    }
}

/// Small ✓ shown next to a verified user's name. Badge only — never any document data.
struct VerifiedTick: View {
    var body: some View {
        Image(systemName: "checkmark.seal.fill")
            .font(.system(size: 12))
            .foregroundStyle(Theme.Colors.success)
            .accessibilityLabel("Verified")
    }
}

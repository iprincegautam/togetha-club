import SwiftUI

/// Sign up / log in with email + password. Real Supabase auth via `AuthService`
/// when the backend is configured; otherwise a polished mock flow so the app
/// stays demoable. Apple/Google remain mocks (a later slice).
struct AuthView: View {
    let onSignedIn: () -> Void

    private enum Mode { case signUp, signIn }

    // Default to log in: most people opening the app already have an account —
    // website applicants (created at apply/pay time) and returning app users.
    // Pushing them into "Create account" causes duplicate-signup / already-exists
    // errors. New users switch to sign up with one tap.
    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var submitting = false
    @State private var errorText: String?
    @State private var infoText: String?
    @FocusState private var focus: Field?

    private enum Field { case email, password }

    private var real: Bool { Config.shared.isConfigured }
    private var emailValid: Bool { email.contains("@") && email.contains(".") && !email.hasSuffix(".") }
    private var passwordValid: Bool { password.count >= 6 }
    private var formValid: Bool { emailValid && passwordValid }

    private var title: String { mode == .signUp ? "Create your account." : "Welcome back." }
    private var subtitle: String {
        mode == .signUp
            ? "Email and a password. Your quiz and screening history live here."
            : "Log in to pick up where you left off."
    }
    private var cta: String { mode == .signUp ? "Sign up" : "Log in" }

    // MARK: - Submit

    private func submit() async {
        submitting = true; errorText = nil; infoText = nil
        defer { submitting = false }

        guard real else {                              // mock fallback
            try? await Task.sleep(nanoseconds: 700_000_000)
            onSignedIn(); return
        }

        do {
            switch mode {
            case .signIn:
                try await AuthService.shared.signIn(email: email, password: password)
                onSignedIn()
            case .signUp:
                let signedIn = try await AuthService.shared.signUp(email: email, password: password)
                if signedIn {
                    onSignedIn()
                } else {
                    // GoTrue returns this both for a genuine new signup awaiting
                    // confirmation AND (anti-enumeration) for an email that already
                    // has an account — so cover both honestly and drop them on Log in.
                    infoText = "Check your email to confirm — or if you already have an account, just log in below."
                    withAnimation(Theme.Motion.spring) { mode = .signIn }
                }
            }
        } catch {
            let msg = friendly(error)
            errorText = msg
            // If they tried to sign up with an email that already exists, flip
            // them to log in (email/password stay filled) — no dead end.
            if mode == .signUp, msg.contains("log in instead") {
                withAnimation(Theme.Motion.spring) { mode = .signIn }
            }
        }
    }

    private func friendly(_ error: Error) -> String {
        let msg = (error as? LocalizedError)?.errorDescription ?? "Something went wrong. Try again."
        let lower = msg.lowercased()
        if lower.contains("not confirmed") { return "Confirm your email first — check your inbox for the link." }
        if lower.contains("invalid login") { return "That email or password doesn't match." }
        if lower.contains("already registered") { return "That email already has an account — log in instead." }
        return msg
    }

    // MARK: - Body

    var body: some View {
        ZStack {
            LinearGradient(colors: [Theme.Colors.forest, Theme.Colors.forestDeep],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            MountainSilhouette()
                .fill(.white.opacity(0.05))
                .frame(height: 200)
                .frame(maxHeight: .infinity, alignment: .bottom)
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    header
                    form
                    orDivider
                    socialButton("Continue with Apple", icon: "apple.logo")
                    socialButton("Continue with Google", icon: "globe")
                    Text("By continuing you agree to our Terms & Privacy Policy.")
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.offWhite.opacity(0.45))
                        .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, Theme.Spacing.lg)
                .padding(.top, Theme.Spacing.xxl * 2)
                .padding(.bottom, Theme.Spacing.xl)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .animation(Theme.Motion.spring, value: mode)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            HStack(spacing: Theme.Spacing.sm) {
                Image("Logo")
                    .renderingMode(.template).resizable().scaledToFit()
                    .foregroundStyle(Theme.Colors.offWhite)
                    .frame(width: 28, height: 28)
                Text("TOGETHA.CLUB")
                    .font(Theme.Typo.label).kerning(2)
                    .foregroundStyle(Theme.Colors.amber)
            }
            Text(title)
                .font(Theme.Typo.hero())
                .foregroundStyle(Theme.Colors.offWhite)
                .lineLimit(2).minimumScaleFactor(0.75)
            Text(subtitle)
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.offWhite.opacity(0.75))
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var form: some View {
        VStack(spacing: Theme.Spacing.md) {
            authField("Email", text: $email, field: .email,
                      keyboard: .emailAddress, secure: false)
            authField("Password", text: $password, field: .password,
                      keyboard: .default, secure: true)

            PrimaryButton(title: cta, isLoading: submitting) {
                Task { await submit() }
            }
            .disabled(!formValid || submitting)
            .opacity(formValid ? 1 : 0.55)

            if let infoText {
                message(infoText, color: Theme.Colors.amberSoft)
            }
            if let errorText {
                message(errorText, color: Theme.Colors.danger.opacity(0.95))
            }

            Button {
                withAnimation(Theme.Motion.spring) {
                    mode = mode == .signUp ? .signIn : .signUp
                    errorText = nil; infoText = nil
                }
            } label: {
                Text(mode == .signUp ? "Already have an account? Log in"
                                     : "New here? Create an account")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.offWhite.opacity(0.7))
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func message(_ text: String, color: Color) -> some View {
        Text(text)
            .font(Theme.Typo.caption)
            .foregroundStyle(color == Theme.Colors.amberSoft ? Theme.Colors.amberSoft : .white)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Theme.Spacing.sm)
            .background(color.opacity(0.18), in: RoundedRectangle(cornerRadius: Theme.Radius.button))
    }

    private var orDivider: some View {
        HStack {
            Rectangle().fill(.white.opacity(0.15)).frame(height: 1)
            Text("or").font(Theme.Typo.label).foregroundStyle(Theme.Colors.offWhite.opacity(0.55))
            Rectangle().fill(.white.opacity(0.15)).frame(height: 1)
        }
    }

    private func authField(_ label: String, text: Binding<String>, field: Field,
                           keyboard: UIKeyboardType, secure: Bool) -> some View {
        Group {
            if secure {
                SecureField("", text: text, prompt: Text(label).foregroundStyle(Theme.Colors.offWhite.opacity(0.4)))
            } else {
                TextField("", text: text, prompt: Text(label).foregroundStyle(Theme.Colors.offWhite.opacity(0.4)))
                    .keyboardType(keyboard)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
        }
        .focused($focus, equals: field)
        .font(Theme.Typo.bodyMedium)
        .foregroundStyle(Theme.Colors.offWhite)
        .padding(Theme.Spacing.md)
        .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: Theme.Radius.button))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button)
            .strokeBorder(focus == field ? Theme.Colors.amber.opacity(0.6) : .white.opacity(0.15)))
    }

    private func socialButton(_ title: String, icon: String) -> some View {
        Button {
            onSignedIn()   // still a mock — a later slice
        } label: {
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: icon)
                Text(title)
            }
            .font(Theme.Typo.bodyMedium)
            .foregroundStyle(Theme.Colors.offWhite)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.md)
            .background(.white.opacity(0.1), in: RoundedRectangle(cornerRadius: Theme.Radius.button))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(.white.opacity(0.18)))
        }
        .buttonStyle(SpringPressStyle())
    }
}

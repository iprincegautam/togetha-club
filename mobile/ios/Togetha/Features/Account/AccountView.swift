import SwiftUI

struct AccountView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.api) private var api
    @State private var profile = MockAPIClient.profile
    @AppStorage("notifScreening") private var notifScreening = true
    @AppStorage("notifTrips") private var notifTrips = true
    @AppStorage("notifFeed") private var notifFeed = false
    @State private var showSignOut = false
    @State private var showDelete = false
    @State private var showKyc = false
    @State private var showVerification = false
    @State private var showAuth = false

    var body: some View {
        NavigationStack {
            if appState.signedIn {
                signedInBody
            } else {
                signedOutBody
            }
        }
    }

    // MARK: - Signed out

    /// Auth-gated state: nothing personal — just the door in.
    private var signedOutBody: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Spacer()

            Image("Logo")
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .foregroundStyle(Theme.Colors.brandText)
                .frame(width: 64, height: 64)

            VStack(spacing: Theme.Spacing.xs) {
                Text("Log in or sign up")
                    .font(Theme.Typo.title())
                    .foregroundStyle(Theme.Colors.brandText)
                Text("Your quiz, screening status, and bookings live here.")
                    .font(Theme.Typo.body)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, Theme.Spacing.lg)

            PrimaryButton(title: "Log in / Sign up") { showAuth = true }
                .padding(.horizontal, Theme.Spacing.lg)

            Spacer()
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background { AmbientBackground() }
        .navigationTitle("Account")
        .trackScreen("Account")
        .fullScreenCover(isPresented: $showAuth) {
            AuthView {
                appState.signedIn = true
                showAuth = false
            }
        }
    }

    // MARK: - Signed in

    private var signedInBody: some View {
            List {
                profileSection
                tripSection
                verificationSection
                supportSection
                paymentsSection
                notificationsSection
                dangerSection
            }
            .scrollContentBackground(.hidden)
            .background { AmbientBackground() }
            .navigationTitle("Account")
            .trackScreen("Account")
            .task {
                // Real profile + payment ledger for the signed-in user (mock otherwise).
                if let p = try? await api.fetchProfile() { profile = p }
                if let pays = try? await api.fetchPayments() { appState.payments = pays }
            }
            .confirmationDialog("Log out of Togetha?", isPresented: $showSignOut, titleVisibility: .visible) {
                // Logging out keeps quiz data — only the session flips.
                Button("Log out", role: .destructive) {
                    AuthService.shared.signOut()
                    withAnimation(Theme.Motion.spring) {
                        appState.signedIn = false
                        appState.application = nil
                        // Clear device-level quiz state so the next account isn't
                        // wrongly skipped past the quiz — it's re-gated on login.
                        appState.quizCompleted = false
                        appState.quizAnswers = [:]
                    }
                }
            }
            .confirmationDialog(
                "Delete your account? This removes your profile, applications, and photos. Paid amounts are settled per our refund policy.",
                isPresented: $showDelete, titleVisibility: .visible
            ) {
                Button("Delete account", role: .destructive) {}
            }
            .sheet(isPresented: $showKyc) {
                KycView()
                    .presentationDetents([.large])
                    .presentationCornerRadius(Theme.Radius.sheet)
            }
            .sheet(isPresented: $showVerification) {
                VerificationView()
                    .presentationDetents([.large])
                    .presentationCornerRadius(Theme.Radius.sheet)
            }
    }

    private var profileSection: some View {
        Section {
            HStack(spacing: Theme.Spacing.md) {
                ZStack {
                    Circle().fill(Theme.Colors.forest)
                    Text(String(profile.name.prefix(1)))
                        .font(Theme.Typo.h2())
                        .foregroundStyle(Theme.Colors.amber)
                }
                .frame(width: 56, height: 56)

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: Theme.Spacing.xs) {
                        Text(profile.name)
                            .font(Theme.Typo.h2())
                            .foregroundStyle(Theme.Colors.text)
                        if appState.isVerified {
                            VerifiedTick()
                        }
                    }
                    Text("\(profile.city) · \(profile.gender)")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                }
            }
            .padding(.vertical, Theme.Spacing.xs)
            .listRowBackground(Theme.Colors.card)
        }
    }

    private var tripSection: some View {
        Section("Your trip") {
            NavigationLink {
                LogisticsView()
            } label: {
                HStack {
                    Image(systemName: "map.circle.fill")
                        .foregroundStyle(Theme.Colors.amber)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Trip logistics")
                            .font(Theme.Typo.body)
                            .foregroundStyle(Theme.Colors.text)
                        Text("Pickup, guide, vehicle & where you'll stay")
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                }
            }
            .listRowBackground(Theme.Colors.card)
        }
    }

    private var verificationSection: some View {
        Section("Profile & verification") {
            Button {
                showKyc = true
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Complete profile (KYC)")
                            .font(Theme.Typo.body)
                            .foregroundStyle(Theme.Colors.text)
                        Text(appState.application?.kycStatus.label ?? "Bio, emergency contact, logistics")
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                    Spacer()
                    if appState.application?.kycStatus == .submitted {
                        StatusChip(text: "Submitted", color: Theme.Colors.amber)
                    } else if appState.application?.kycStatus == .approved {
                        VerifiedBadge(text: "Approved")
                    } else {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12))
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                }
            }
            .listRowBackground(Theme.Colors.card)

            Button {
                showVerification = true
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Get verified ✓")
                            .font(Theme.Typo.body)
                            .foregroundStyle(Theme.Colors.text)
                        Text("LinkedIn, work, ID — a real person checks it.")
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                    Spacer()
                    StatusChip(
                        text: appState.verificationStatus.label,
                        color: verificationChipColor
                    )
                }
            }
            .listRowBackground(Theme.Colors.card)

            NavigationLink {
                MyQuizView()
            } label: {
                VStack(alignment: .leading, spacing: 2) {
                    Text("My quiz & compatibility")
                        .font(Theme.Typo.body)
                        .foregroundStyle(Theme.Colors.text)
                    Text(appState.lastMatchResult.map { "\($0.score)% · \($0.archetype.rawValue)" }
                         ?? "Take the 13-question quiz")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                }
            }
            .listRowBackground(Theme.Colors.card)
        }
    }

    private var verificationChipColor: Color {
        switch appState.verificationStatus {
        case .verified: Theme.Colors.success
        case .submitted: Theme.Colors.amber
        case .rejected: Theme.Colors.danger
        case .notStarted: Theme.Colors.textMuted
        }
    }

    private var supportSection: some View {
        Section("Support") {
            NavigationLink {
                QueriesView()
            } label: {
                Label {
                    Text("My queries & feedback")
                        .font(Theme.Typo.body)
                        .foregroundStyle(Theme.Colors.text)
                } icon: {
                    Image(systemName: "text.bubble")
                        .foregroundStyle(Theme.Colors.amber)
                }
            }
            .listRowBackground(Theme.Colors.card)

            VStack(alignment: .leading, spacing: 2) {
                Text("Support hours")
                    .font(Theme.Typo.body)
                    .foregroundStyle(Theme.Colors.text)
                Text("Mon–Sat, 10:00 AM–7:00 PM IST · WhatsApp +91 70541 83391")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
            }
            .listRowBackground(Theme.Colors.card)
        }
    }

    private var paymentsSection: some View {
        Section("Payments") {
            if appState.payments.isEmpty {
                Text("No payments yet.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .listRowBackground(Theme.Colors.card)
            }
            ForEach(appState.payments) { payment in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(payment.label)
                            .font(Theme.Typo.body)
                            .foregroundStyle(Theme.Colors.text)
                        Text(payment.date.formatted(date: .abbreviated, time: .omitted))
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(payment.amount.inr)
                            .font(Theme.Typo.bodyMedium)
                            .foregroundStyle(Theme.Colors.text)
                        Text(payment.status)
                            .font(Theme.Typo.label)
                            .foregroundStyle(Theme.Colors.success)
                    }
                }
                .listRowBackground(Theme.Colors.card)
            }
        }
    }

    private var notificationsSection: some View {
        Section("Notifications") {
            Toggle("Screening updates", isOn: $notifScreening)
            Toggle("New trips & batches", isOn: $notifTrips)
            Toggle("Feed activity", isOn: $notifFeed)
        }
        .listRowBackground(Theme.Colors.card)
        .tint(Theme.Colors.amber)
    }

    private var dangerSection: some View {
        Section {
            Button("Log out") { showSignOut = true }
                .foregroundStyle(Theme.Colors.text)
            Button("Delete account", role: .destructive) { showDelete = true }
        }
        .listRowBackground(Theme.Colors.card)
    }
}

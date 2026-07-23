import SwiftUI

/// Post-booking trip logistics — pickup, vehicle, guide contact, and hotel
/// photos of the booked stays. Gated by the booking state: the whole screen is
/// locked until the applicant is approved and has paid (the guide's phone
/// number is a privacy gate, matching the website's server-enforced rule).
struct LogisticsView: View {
    @Environment(\.api) private var api
    @Environment(AppState.self) private var appState

    @State private var logistics: DepartureLogistics?
    @State private var isLoading = true

    /// Approved (profile signed off) or paid (confirmed) → logistics unlock.
    private var isUnlocked: Bool {
        switch appState.application?.status {
        case .approved, .paid: return true
        default: return false
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                Text("Pickup point, vehicle, your guide's contact, and where you'll stay — shared once your profile is approved and your departure is confirmed.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, Theme.Spacing.sm)

                if appState.application == nil {
                    noTripState
                } else if !isUnlocked {
                    lockedState
                } else if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.top, Theme.Spacing.xxl)
                } else if let l = logistics {
                    gettingThere(l)
                    comingBack(l)
                    guide(l)
                    stays(l)
                }
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .navigationTitle("Trip logistics")
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("Logistics")
        .task {
            guard isUnlocked, logistics == nil else { return }
            logistics = try? await api.fetchLogistics()
            withAnimation(Theme.Motion.spring) { isLoading = false }
        }
    }

    // MARK: - Empty / locked

    private var noTripState: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Image(systemName: "suitcase.fill")
                .font(.system(size: 26))
                .foregroundStyle(Theme.Colors.amber)
            Text("No trip yet")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.brandText)
            Text("Once you're booked onto a batch and approved, your pickup point, vehicle, guide, and stays all show up here.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.xl)
        .glassCard()
        .padding(.top, Theme.Spacing.lg)
    }

    private var lockedState: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Image(systemName: "lock.fill")
                .font(.system(size: 26))
                .foregroundStyle(Theme.Colors.forest)
            Text("Logistics locked")
                .font(Theme.Typo.h2())
                .foregroundStyle(Theme.Colors.brandText)
            Text("Pickup point, vehicle number, and your guide's contact appear here once your profile is approved and your departure batch is confirmed.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(Theme.Spacing.xl)
        .glassCard()
        .padding(.top, Theme.Spacing.lg)
    }

    // MARK: - Sections

    private func gettingThere(_ l: DepartureLogistics) -> some View {
        card(title: "Getting there", icon: "bus.fill") {
            row("Pickup location", l.pickupLocation)
            row("Reporting time", l.reportingTime)
            row("Departure time", l.departureTime)
            row("Vehicle number", l.vehicleNumber, mono: true)
        }
    }

    private func comingBack(_ l: DepartureLogistics) -> some View {
        card(title: "Coming back", icon: "arrow.uturn.left") {
            row("Arrival in Delhi", l.arrivalTime)
        }
    }

    private func guide(_ l: DepartureLogistics) -> some View {
        card(title: "Your trip guide", icon: "person.badge.shield.checkmark") {
            row("Guide", l.guideName)
            Link(destination: URL(string: "tel:\(l.guidePhone)")!) {
                HStack {
                    Text("Phone").font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
                    Spacer()
                    HStack(spacing: 4) {
                        Image(systemName: "phone.fill").font(.system(size: 11))
                        Text(l.guidePhone).font(Theme.Typo.bodyMedium)
                    }
                    .foregroundStyle(Theme.Colors.amber)
                }
            }
            Link(destination: URL(string: "mailto:\(l.guideEmail)")!) {
                HStack {
                    Text("Email").font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
                    Spacer()
                    Text(l.guideEmail).font(Theme.Typo.bodyMedium).foregroundStyle(Theme.Colors.amber)
                }
            }
        }
    }

    @ViewBuilder
    private func stays(_ l: DepartureLogistics) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            SectionHeader(title: "Where you'll stay")
            ForEach(l.stays) { stay in
                VStack(alignment: .leading, spacing: 0) {
                    Color.clear
                        .frame(maxWidth: .infinity)
                        .frame(height: 150)
                        .overlay {
                            if let name = stay.imageName {
                                Image(name).resizable().scaledToFill()
                            } else {
                                LinearGradient(colors: [Theme.Colors.forest, Theme.Colors.forestDeep],
                                               startPoint: .topLeading, endPoint: .bottomTrailing)
                            }
                        }
                        .clipped()
                        .overlay(alignment: .topTrailing) {
                            Text("\(stay.nights) night\(stay.nights == 1 ? "" : "s")")
                                .font(Theme.Typo.label)
                                .foregroundStyle(Theme.Colors.ink)
                                .padding(.horizontal, Theme.Spacing.sm)
                                .padding(.vertical, 4)
                                .background(Theme.Colors.amberSoft, in: Capsule())
                                .padding(Theme.Spacing.sm)
                        }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(stay.name)
                            .font(Theme.Typo.bodyMedium)
                            .foregroundStyle(Theme.Colors.text)
                        Text(stay.location)
                            .font(Theme.Typo.label)
                            .foregroundStyle(Theme.Colors.amber)
                        Text(stay.note)
                            .font(Theme.Typo.caption)
                            .foregroundStyle(Theme.Colors.textMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(Theme.Spacing.md)
                }
                .background(Theme.Glass.tint)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Glass.highlight, lineWidth: 1))
                .shadow(color: Theme.Glass.shadow, radius: 16, y: 8)
            }
        }
    }

    // MARK: - Building blocks

    private func card<Content: View>(title: String, icon: String, @ViewBuilder _ content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack(spacing: Theme.Spacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.Colors.amber)
                Text(title)
                    .font(Theme.Typo.h2())
                    .foregroundStyle(Theme.Colors.brandText)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .glassCard()
    }

    private func row(_ label: String, _ value: String, mono: Bool = false) -> some View {
        HStack(alignment: .top) {
            Text(label)
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
            Spacer(minLength: Theme.Spacing.md)
            Text(value.isEmpty ? DepartureLogistics.tbc : value)
                .font(mono ? Theme.Typo.bodyMedium.monospaced() : Theme.Typo.bodyMedium)
                .foregroundStyle(Theme.Colors.text)
                .multilineTextAlignment(.trailing)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

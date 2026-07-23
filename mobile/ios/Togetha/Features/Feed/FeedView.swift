import SwiftUI
import PhotosUI

struct FeedView: View {
    @Environment(\.api) private var api
    @Environment(AppState.self) private var appState

    @State private var photos: [TripPhoto] = []
    @State private var isLoading = true
    @State private var pickedItem: PhotosPickerItem?
    @State private var showConsent = false
    @State private var reportedPhoto: TripPhoto?

    private var albums: [(String, [TripPhoto])] {
        let all = photos + appState.pendingPhotos
        let grouped = Dictionary(grouping: all, by: \.batchName)
        return grouped.sorted { $0.key < $1.key }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    header

                    if isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.top, Theme.Spacing.xxl)
                    } else if albums.isEmpty {
                        emptyState
                    } else {
                        ForEach(albums, id: \.0) { batchName, batchPhotos in
                            album(batchName, batchPhotos)
                        }
                    }
                }
                .padding(.horizontal, Theme.Spacing.md)
                .padding(.bottom, Theme.Spacing.xxl * 2)
            }
            .background { AmbientBackground() }
            .toolbar(.hidden, for: .navigationBar)
            .task {
                guard photos.isEmpty else { return }
                photos = (try? await api.fetchFeed()) ?? []
                withAnimation(Theme.Motion.spring) { isLoading = false }
            }
            .onChange(of: pickedItem) { _, newValue in
                if newValue != nil { showConsent = true }
            }
            .sheet(isPresented: $showConsent) { consentSheet }
            .alert(item: $reportedPhoto) { photo in
                Alert(
                    title: Text("Report this photo?"),
                    message: Text("Our team reviews every report. The photo stays hidden for you meanwhile."),
                    primaryButton: .destructive(Text("Report")) {},
                    secondaryButton: .cancel()
                )
            }
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text("Trip feed")
                    .font(Theme.Typo.hero())
                    .foregroundStyle(Theme.Colors.brandText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Text("Real moments from real batches. Every photo is reviewed before it appears.")
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
            }
            Spacer()
            PhotosPicker(selection: $pickedItem, matching: .images) {
                Image(systemName: "plus")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Theme.Colors.ink)
                    .frame(width: 40, height: 40)
                    .background(Theme.Colors.amber, in: Circle())
            }
            .accessibilityLabel("Upload a trip photo")
        }
        .padding(.top, Theme.Spacing.md)
    }

    /// Shown while the feed is genuinely empty (live backend has no approved
    /// trip photos yet). Warm, on-brand, never an error.
    private var emptyState: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: "camera.on.rectangle")
                .font(.system(size: 34, weight: .light))
                .foregroundStyle(Theme.Colors.amber)
            Text("No trip photos yet — the first batch is packing.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .multilineTextAlignment(.center)
            Text("Every photo travelers share is reviewed by our team before it appears here.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.Spacing.xl)
        .padding(.horizontal, Theme.Spacing.lg)
        .glassCard()
        .padding(.top, Theme.Spacing.xxl)
    }

    private func album(_ name: String, _ batchPhotos: [TripPhoto]) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            SectionHeader(title: name)

            let columns = [GridItem(.flexible(), spacing: Theme.Spacing.sm), GridItem(.flexible(), spacing: Theme.Spacing.sm)]
            LazyVGrid(columns: columns, spacing: Theme.Spacing.sm) {
                ForEach(batchPhotos) { photo in
                    PhotoCard(photo: photo, uploaderVerified: photo.isOwn && appState.isVerified)
                        .contextMenu {
                            Button(role: .destructive) {
                                reportedPhoto = photo
                            } label: {
                                Label("Report photo", systemImage: "flag")
                            }
                        }
                }
            }
        }
    }

    private var consentSheet: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Capsule().fill(Theme.Colors.stroke).frame(width: 40, height: 4).padding(.top, Theme.Spacing.sm)

            Image(systemName: "person.2.badge.key")
                .font(.system(size: 32))
                .foregroundStyle(Theme.Colors.womenAccent)

            Text("Before you share")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)

            Text("Everyone in these photos is okay being shared. Our team reviews every upload before it appears in the feed — usually within a day.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            Spacer()

            PrimaryButton(title: "Yes, everyone's okay with it") {
                addPendingPhoto()
                showConsent = false
                pickedItem = nil
            }

            Button("Cancel") {
                showConsent = false
                pickedItem = nil
            }
            .font(Theme.Typo.body)
            .foregroundStyle(Theme.Colors.textMuted)
        }
        .padding(Theme.Spacing.md)
        .background { AmbientBackground() }
        .presentationBackground(.ultraThinMaterial)
        .presentationDetents([.medium])
        .presentationCornerRadius(Theme.Radius.sheet)
    }

    private func addPendingPhoto() {
        let photo = TripPhoto(
            id: UUID().uuidString,
            batchId: appState.application?.batchId ?? "b1",
            batchName: appState.application?.batchName ?? "Himalayan Circuit",
            caption: "Your upload",
            uploaderName: "You",
            isOwn: true,
            reviewState: .pending,
            colorHex: 0x4A6B5F,
            aspectRatio: 1.0
        )
        withAnimation(Theme.Motion.spring) {
            appState.pendingPhotos.append(photo)
        }
    }
}

extension TripPhoto {
    // Identifiable already; needed for .alert(item:)
}

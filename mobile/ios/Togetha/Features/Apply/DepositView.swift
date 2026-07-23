import SwiftUI

struct DepositView: View {
    let batch: Batch
    var plan: PaymentPlan = .deposit
    let onPaid: () -> Void

    @Environment(\.api) private var api
    @State private var order: PaymentOrder?
    @State private var showCheckout = false
    @State private var creating = false

    private var amount: Int { plan == .full ? batch.priceTotal : batch.depositAmount }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text("Reserve your screening slot")
                        .font(Theme.Typo.title())
                        .foregroundStyle(Theme.Colors.brandText)
                    Text(plan == .full
                         ? "You're paying in full — but your seat is still subject to human screening. If it's not a fit, everything is refunded."
                         : "This deposit holds a slot for human review — it isn't a seat confirmation.")
                        .font(Theme.Typo.caption)
                        .foregroundStyle(Theme.Colors.textMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                VStack(spacing: Theme.Spacing.sm) {
                    summaryRow("Batch", batch.name)
                    summaryRow("Route", "\(batch.route) · \(batch.durationText)")
                    Divider()
                    if plan == .full {
                        summaryRow("Full payment", batch.priceTotal.inr, bold: true)
                    } else {
                        summaryRow("Deposit (30%) — reserves screening", batch.depositAmount.inr, bold: true)
                        summaryRow("Balance — within 48h of approval", batch.balanceAmount.inr)
                    }
                }
                .padding(Theme.Spacing.md)
                .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))

                Text(batch.depositCopy)
                    .font(Theme.Typo.caption.weight(.medium))
                    .foregroundStyle(Theme.Colors.amber)

                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    Label("A human reviews your profile in 24–36 hours.", systemImage: "person.badge.shield.checkmark")
                    Label("Approved? A 48-hour balance window opens.", systemImage: "clock.badge.checkmark")
                    Label("Not a fit this time? Refund in 5–7 business days.", systemImage: "arrow.uturn.left.circle")
                }
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)

                PrimaryButton(title: "Pay \(amount.inr)", isLoading: creating) {
                    Task {
                        creating = true
                        order = try? await api.createOrder(batchId: batch.id, purpose: plan.rawValue)
                        creating = false
                        showCheckout = true
                    }
                }
            }
            .padding(Theme.Spacing.md)
        }
        .sheet(isPresented: $showCheckout) {
            MockCheckoutSheet(
                amount: order?.amount ?? amount,
                purpose: plan == .full ? "Full payment (screening still applies)" : "Screening-slot deposit"
            ) {
                showCheckout = false
                onPaid()
            }
            .presentationDetents([.medium, .large])
            .presentationCornerRadius(Theme.Radius.sheet)
        }
    }

    private func summaryRow(_ label: String, _ value: String, bold: Bool = false) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
            Spacer()
            Text(value)
                .font(bold ? Theme.Typo.bodyMedium : Theme.Typo.body)
                .foregroundStyle(Theme.Colors.text)
        }
    }
}

// MARK: - Mock checkout (stands in for Razorpay)

struct MockCheckoutSheet: View {
    let amount: Int
    let purpose: String
    let onSuccess: () -> Void

    @State private var processing = false

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Capsule().fill(Theme.Colors.stroke).frame(width: 40, height: 4).padding(.top, Theme.Spacing.sm)

            VStack(spacing: Theme.Spacing.xs) {
                Text("Togetha Checkout")
                    .font(Theme.Typo.h2())
                    .foregroundStyle(Theme.Colors.brandText)
                Text(purpose)
                    .font(Theme.Typo.caption)
                    .foregroundStyle(Theme.Colors.textMuted)
            }

            Text(amount.inr)
                .font(Theme.Typo.hero())
                .foregroundStyle(Theme.Colors.text)

            VStack(spacing: Theme.Spacing.sm) {
                methodRow("UPI", icon: "indianrupeesign.circle")
                methodRow("Card ending 4242", icon: "creditcard")
            }

            Spacer()

            #if DEBUG
            // Debug-only mock payment so the flow can be tested end to end.
            PrimaryButton(title: processing ? "Processing…" : "Pay \(amount.inr)", isLoading: processing) {
                processing = true
                Task {
                    try? await Task.sleep(nanoseconds: 1_200_000_000)
                    onSuccess()
                }
            }

            Text("Test checkout — no real money moves in this build.")
                .font(Theme.Typo.label)
                .foregroundStyle(Theme.Colors.textMuted)
            #else
            // Release: payments aren't live yet — never fake a charge.
            PrimaryButton(title: "Payments open soon") {}
                .disabled(true)
                .opacity(0.55)

            Text("Online payment is being enabled. Our crew will reach out on WhatsApp to complete your booking.")
                .font(Theme.Typo.label)
                .foregroundStyle(Theme.Colors.textMuted)
                .multilineTextAlignment(.center)
            #endif
        }
        .padding(Theme.Spacing.md)
        .background { AmbientBackground() }
    }

    private func methodRow(_ label: String, icon: String) -> some View {
        HStack {
            Image(systemName: icon).foregroundStyle(Theme.Colors.amber)
            Text(label).font(Theme.Typo.body).foregroundStyle(Theme.Colors.text)
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(Theme.Colors.textMuted)
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
    }
}

// MARK: - Status reserved

struct StatusReservedView: View {
    var paidInFull = false
    let onDone: () -> Void
    @State private var ringProgress: CGFloat = 0

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            Spacer()

            ZStack {
                Circle()
                    .stroke(Theme.Colors.forest.opacity(0.15), lineWidth: 6)
                Circle()
                    .trim(from: 0, to: ringProgress)
                    .stroke(Theme.Colors.amber, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Image(systemName: "hourglass")
                    .font(.system(size: 30))
                    .foregroundStyle(Theme.Colors.amber)
            }
            .frame(width: 110, height: 110)
            .onAppear {
                withAnimation(Theme.Motion.spring.speed(0.35).delay(0.3)) { ringProgress = 0.35 }
            }

            VStack(spacing: Theme.Spacing.sm) {
                Text("Your screening slot is reserved.")
                    .font(Theme.Typo.title())
                    .foregroundStyle(Theme.Colors.brandText)
                    .multilineTextAlignment(.center)
                Text(paidInFull
                     ? "A human reviews every profile — decision in 24–36 hours. You've paid in full, so approval confirms your seat directly. You've also been added to your batch's Travelers chat."
                     : "A human reviews every profile — decision in 24–36 hours. Once approved, you'll have 48 hours to pay the balance. Meanwhile: you're in your batch's Travelers chat, and completing your profile speeds up review.")
                    .font(Theme.Typo.body)
                    .foregroundStyle(Theme.Colors.textMuted)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(Theme.Spacing.md)

            Spacer()

            PrimaryButton(title: "Done") { onDone() }
                .padding(Theme.Spacing.md)
        }
        .background { AmbientBackground() }
    }
}

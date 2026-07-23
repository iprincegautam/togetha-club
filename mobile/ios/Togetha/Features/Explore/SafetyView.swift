import SwiftUI

struct SafetyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.xl) {
                ExploreHero(
                    eyebrow: "✦ Verified Humans Only ✦",
                    headline: "Not everyone gets in. **That's the point.**",
                    sub: "You're about to travel with people you haven't met. That only works if the room is safe first. So we built the whole thing backwards from that one rule — and we check every single person by hand before they're ever confirmed."
                )

                CaptionedPhoto(image: ExploreImage(
                    name: "himalayan-safety-verified",
                    caption: "Your safety is the product — verified by a real person"
                ))
                .springReveal(delay: 0.1)

                gateSection
                guaranteeSection
                onTheGroundSection
                noPressureSection
                structureSection
                dataSection
                tripLeadsSection
                caseFileSection
                declinedSection
                founderNoteSection
                faqSection
                closingSection
            }
            .padding(.horizontal, Theme.Spacing.md)
            .padding(.top, Theme.Spacing.md)
            .padding(.bottom, Theme.Spacing.xxl)
        }
        .background { AmbientBackground() }
        .navigationTitle("Safety")
        .navigationBarTitleDisplayMode(.inline)
        .trackScreen("Safety")
    }

    // MARK: 1 · The gate

    private var gateSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text.styled("\"Verified\" usually means a bot glanced at a selfie. Here, a **real person** opens your file.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)
            Text("Before anyone joins a batch, we cross-check — by hand:")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)

            checkCard("Government ID", "Confirmed, real, and current.")
            checkCard("LinkedIn & work", "The job and the history line up.")
            checkCard("Socials", "The person online is the person on the ID.")

            Text("One human reads all of it together and confirms it's the same person. If the story doesn't line up, they don't get in — no matter how full the batch is, no matter the revenue. The room has to be safe first. Everything else is second.")
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func checkCard(_ title: String, _ detail: String) -> some View {
        HStack(alignment: .top, spacing: Theme.Spacing.md) {
            Image(systemName: "checkmark.seal.fill")
                .foregroundStyle(Theme.Colors.success)
                .frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(Theme.Typo.bodyMedium).foregroundStyle(Theme.Colors.text)
                Text(detail).font(Theme.Typo.caption).foregroundStyle(Theme.Colors.textMuted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.button))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.button).strokeBorder(Theme.Colors.stroke))
    }

    // MARK: 2 · Guarantee

    private var guaranteeSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            StampView(text: "Safe by design ♡", color: Theme.Colors.womenAccent)
            Text("Can't verify you? Full refund.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
            Text("We'd rather lose a booking than put a question mark in the room. If we can't confirm you're exactly who you say you are, you don't join — and you get every rupee back. No arguing, no exceptions.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
        .springReveal()
    }

    // MARK: 3 · On the ground

    private var onTheGroundSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text.styled("Verified is where safety **starts** — not where it ends.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)

            LazyVGrid(columns: [GridItem(.flexible(), spacing: Theme.Spacing.sm), GridItem(.flexible())], spacing: Theme.Spacing.sm) {
                groundCard("12 women + 12 men", "A balanced room, every batch.")
                groundCard("Single-gender rooms", "Always. Never a question you have to ask.")
                groundCard("Female trip leads", "Someone who gets it, with you the whole way.")
                groundCard("Captains 24/7", "On the ground, reachable, all trip long.")
            }

            CaptionedPhoto(image: ExploreImage(
                name: "udaipur-safety-verified",
                caption: "Your safety is the product — verified by a real human"
            ), height: 200)
        }
    }

    private func groundCard(_ title: String, _ detail: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(Theme.Typo.bodyMedium).foregroundStyle(Theme.Colors.womenAccent)
            Text(detail)
                .font(Theme.Typo.caption)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
    }

    // MARK: 4–6 · Narrative sections

    private var noPressureSection: some View {
        narrative(
            "No one is here to **force a match.**",
            "This isn't a show and there's no reveal. If there's a spark, it'll be real and it'll be yours. If there isn't, you still go home with 23 people you actually know — still texting, still in your phone months later. That's the worst case. It's a good one."
        )
    }

    private var structureSection: some View {
        narrative(
            "Everything's planned — so you never coordinate **alone with a stranger.**",
            "Travel, stays, most meals, the full itinerary, ice-breakers, bonfire nights — all handled by us. You never have to negotiate where, when, or how with someone you just met. You show up as yourself; the rest is already taken care of."
        )
    }

    private var dataSection: some View {
        narrative(
            "We check your story to keep the room safe. **Then we stop.**",
            "Your ID and documents are used for one thing: confirming you're a real, verified person before you join a batch. That's it. We don't sell it, we don't post it, and it never becomes part of a public profile."
        )
    }

    private func narrative(_ heading: String, _ body: String) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text.styled(heading)
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)
            Text(body)
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: 7 · Trip leads

    private var tripLeadsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text.styled("You won't be handed to a stranger. **You'll be led by her.**")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)
            Text("Every batch travels with a female trip lead — on the ground, reachable, the whole way. Not a chaperone. The person you go to if anything feels off, at any hour.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            leadCard(
                initials: "AG", name: "Anchal Gupta", role: "Trip Lead",
                quote: "My rule is simple: everyone in my batch gets home feeling safer than they arrived.",
                foot: "✦ Led several batches · with you 24/7"
            )
            leadCard(
                initials: "PG", name: "Prince Gautam", role: "Founder & Trip Lead",
                quote: "If anything feels off, you come to me — any hour, no question too small.",
                foot: "✦ Led several batches · with you 24/7"
            )
        }
    }

    private func leadCard(initials: String, name: String, role: String, quote: String, foot: String) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack(spacing: Theme.Spacing.md) {
                Text(initials)
                    .font(Theme.Typo.h2())
                    .foregroundStyle(Theme.Colors.amber)
                    .frame(width: 52, height: 52)
                    .background(Theme.Colors.forest, in: Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(name).font(Theme.Typo.bodyMedium).foregroundStyle(Theme.Colors.text)
                    Text(role).font(Theme.Typo.label).foregroundStyle(Theme.Colors.womenAccent)
                }
            }
            Text("\u{201C}\(quote)\u{201D}")
                .font(.system(size: 16, design: .serif).italic())
                .foregroundStyle(Theme.Colors.text)
                .fixedSize(horizontal: false, vertical: true)
            Text(foot)
                .font(Theme.Typo.label)
                .foregroundStyle(Theme.Colors.amber)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
        .springReveal()
    }

    // MARK: 8 · Case file

    private var caseFileSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text.styled("\"Verified\" is a word. **This is the receipt.**")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .fixedSize(horizontal: false, vertical: true)

            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                HStack {
                    Text("APPLICANT FILE · #REDACTED")
                        .font(.system(size: 12, weight: .semibold, design: .monospaced))
                        .foregroundStyle(Theme.Colors.text)
                    Spacer()
                    Text("✦ Reviewed by hand")
                        .font(Theme.Typo.label)
                        .foregroundStyle(Theme.Colors.amber)
                }
                Divider()
                caseRow("Government ID", "✓ real & current")
                caseRow("LinkedIn & work", "✓ history lines up")
                caseRow("Instagram / socials", "✓ same person")
                caseRow("Cross-check", "ID ↔ LinkedIn ↔ socials")
                Divider()
                HStack {
                    Text("Verdict")
                        .font(.system(size: 12, design: .monospaced))
                        .foregroundStyle(Theme.Colors.textMuted)
                    Spacer()
                    Text("SAME HUMAN — CONFIRMED")
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .foregroundStyle(Theme.Colors.success)
                }
                HStack {
                    Spacer()
                    StampView(text: "Verified · by hand", color: Theme.Colors.success, rotation: -6)
                        .padding(.top, Theme.Spacing.xs)
                }
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.card)
                    .strokeBorder(Theme.Colors.stroke, style: StrokeStyle(lineWidth: 1, dash: [6, 4]))
            )

            Text("Real files, redacted for privacy. We never publish anyone's documents.")
                .font(Theme.Typo.label)
                .foregroundStyle(Theme.Colors.textMuted)
        }
        .springReveal()
    }

    private func caseRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 12, design: .monospaced))
                .foregroundStyle(Theme.Colors.textMuted)
            Spacer()
            Text(value)
                .font(.system(size: 12, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.Colors.success)
        }
    }

    // MARK: 9 · The gate is real

    private var declinedSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            StampView(text: "Declined", color: Theme.Colors.danger)
            (Text("80% ").font(.system(size: 44, weight: .semibold, design: .serif)).foregroundColor(Theme.Colors.danger)
             + Text("of applications don't make it in").font(Theme.Typo.title()).foregroundColor(Theme.Colors.brandText))
                .fixedSize(horizontal: false, vertical: true)
            Text("A safe room isn't the one that lets everyone in — it's the one that turns people away. If we can't confirm someone is exactly who they say they are, they don't travel with you. We'd rather lose the booking.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.danger.opacity(0.06), in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.danger.opacity(0.25)))
    }

    // MARK: 10 · Founder note

    private var founderNoteSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text.styled("I check the hard ones **myself.**")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
            Text("Most apps say \"verified\" and mean a bot glanced at a selfie. I didn't want that on my conscience — not for the women who trust us enough to show up.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            Text("So the checks are done by real people, and the ones that don't sit right, I look at myself. If the story doesn't line up, they don't get in — no matter how full the batch is, no matter the revenue.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            Text("The women in that room trusted us first. Everything we do starts there.")
                .font(Theme.Typo.body)
                .foregroundStyle(Theme.Colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)
            VStack(alignment: .leading, spacing: 2) {
                Text("— Prince Gautam")
                    .font(.system(size: 22, weight: .medium, design: .serif).italic())
                    .foregroundStyle(Theme.Colors.brandText)
                Text("✦ Founder, Togetha")
                    .font(Theme.Typo.label)
                    .foregroundStyle(Theme.Colors.amber)
            }
            .padding(.top, Theme.Spacing.sm)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.card, in: RoundedRectangle(cornerRadius: Theme.Radius.card))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.card).strokeBorder(Theme.Colors.stroke))
    }

    // MARK: 11 · FAQ + close

    private var faqSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            SectionHeader(title: "Questions, answered.")
            ForEach(ExploreCopy.safetyFAQ) { item in
                FAQRow(item: item)
            }
        }
    }

    private var closingSection: some View {
        VStack(alignment: .center, spacing: Theme.Spacing.md) {
            StampView(text: "Welcome to the club", color: Theme.Colors.amber, rotation: -3)
            Text("The women in that room trusted us first. So do the checks.")
                .font(Theme.Typo.title())
                .foregroundStyle(Theme.Colors.brandText)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.Spacing.lg)
    }
}

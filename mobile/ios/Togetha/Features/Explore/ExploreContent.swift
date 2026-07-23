import SwiftUI

// MARK: - Explore navigation

enum ExploreDestination: Hashable {
    case howItWorks
    case safety
    case itineraries(ExploreTrip)
    case journal
    case about
}

enum ExploreTrip: String, CaseIterable, Hashable {
    case himalayan
    case udaipur

    var title: String {
        switch self {
        case .himalayan: "Himalayan Love Trail"
        case .udaipur: "Udaipur Love Trail"
        }
    }

    var route: String {
        switch self {
        case .himalayan: "Manali · Kasol · Sissu"
        case .udaipur: "Udaipur · Kumbhalgarh"
        }
    }

    var durationLine: String {
        switch self {
        case .himalayan: "5 nights · 6 days — Manali, Sissu & Kasol."
        case .udaipur: "2 nights · 3 days — Udaipur & Kumbhalgarh."
        }
    }

    var switcherLabel: String {
        switch self {
        case .himalayan: "Himalayan 5N/6D"
        case .udaipur: "Udaipur 2N/3D"
        }
    }

    /// Full gallery for this destination with the exact image-map captions.
    var gallery: [ExploreImage] {
        switch self {
        case .himalayan:
            return [
                ExploreImage(name: "himalayan-dating-apps-fatigue", caption: "Done with dating apps — ready for the mountains"),
                ExploreImage(name: "himalayan-matchmaking-machine", caption: "The matchmaking machine — companions, not coincidences"),
                ExploreImage(name: "himalayan-campfire-friendships", caption: "Manali · Kasol · Sissu — real friendships around the fire"),
                ExploreImage(name: "himalayan-how-it-works-funnel", caption: "Quiz → match → pick your Friday → human review"),
                ExploreImage(name: "himalayan-safety-verified", caption: "Your safety is the product — verified by a real person")
            ]
        case .udaipur:
            return [
                ExploreImage(name: "udaipur-dating-apps-fatigue", caption: "Done with dating apps — ready for the lakes"),
                ExploreImage(name: "udaipur-anonymous-profiles", caption: "Who are these strangers — is it safe?"),
                ExploreImage(name: "udaipur-bollywood-house-party", caption: "Bollywood house party — 12+12 balanced & verified"),
                ExploreImage(name: "udaipur-lake-friendships", caption: "Udaipur · Kumbhalgarh — real friendships and a story"),
                ExploreImage(name: "udaipur-how-it-works-funnel", caption: "Quiz → match → pick your weekend → human review"),
                ExploreImage(name: "udaipur-safety-verified", caption: "Your safety is the product — verified by a real human")
            ]
        }
    }

    var coverImage: String {
        switch self {
        case .himalayan: "himalayan-dating-apps-fatigue"
        case .udaipur: "udaipur-dating-apps-fatigue"
        }
    }

    static func forBatch(id: String) -> ExploreTrip? {
        switch id {
        case "batch-a", "batch-b": .himalayan
        case "batch-d", "batch-e": .udaipur
        default: nil
        }
    }
}

struct ExploreImage: Hashable, Identifiable {
    let name: String
    let caption: String
    var id: String { name }
}

// MARK: - Rich text helper (**…** = accent serif emphasis)

extension Text {
    /// Renders a copy string where **…** segments get the accent color.
    static func styled(_ string: String, accent: Color = Theme.Colors.amber) -> Text {
        var result = Text(verbatim: "")
        let parts = string.components(separatedBy: "**")
        for (index, part) in parts.enumerated() {
            if index % 2 == 1 {
                result = result + Text(verbatim: part).foregroundColor(accent)
            } else {
                result = result + Text(verbatim: part)
            }
        }
        return result
    }
}

// MARK: - FAQ

struct FAQItem: Identifiable, Hashable {
    let question: String
    let answer: String
    var id: String { question }
}

enum ExploreCopy {

    // MARK: How It Works

    static let howItWorksFAQ: [FAQItem] = [
        FAQItem(question: "What exactly is Togetha.Club?", answer: "India's first matchmaking travel club for verified singles. Take the quiz, book your slot for the Friday you want, pay on the website, and show up for a trip with 24 people (12 women, 12 men). Choose Himalayan (Manali · Kasol · Sissu, 5N/6D) or Udaipur · Kumbhalgarh (2N/3D) — each with GenZ and Millennial editions. Our AI matches you into the cohort where you're most likely to connect."),
        FAQItem(question: "How does the AI matching work?", answer: "You take a 12-question compatibility quiz (age first, then personality). Your answers become a 12-dimension profile — communication style, values, emotional availability, and more. We use that to recommend your best batch and estimate fit with the kind of people already moving toward each departure. Full preview on Our AI before you apply."),
        FAQItem(question: "What destinations and editions are available?", answer: "Two destinations: Himalayan Love Trail (Manali · Kasol · Sissu) and Udaipur Love Trail (Udaipur · Kumbhalgarh). Each has a GenZ Edition (ages 18–25) and Millennial Edition (ages 26–36). Same 12+12 balance, same quiz-first flow — slightly different energy and price by edition."),
        FAQItem(question: "How do I book my spot?", answer: "Take the 12-question quiz, pick your destination and edition, choose your Friday departure, then reserve your slot on togetha.club with the booking amount. We verify your profile within 24–36 hours, and once you're approved you pay the balance to confirm — 12 women and 12 men on the same trip, AI-matched from your quiz."),
        FAQItem(question: "Is this safe? I'm a woman thinking about coming solo.", answer: "This is built for exactly that. Every batch is 12 women and 12 men — no exceptions. Every participant is identity-verified before they join. We have female trip leads available on request. Accommodation is in private or shared-gender rooms at vetted properties — never mixed dorms. Before departure, all women in the batch are added to a women-only WhatsApp group so you're not arriving as a stranger. If anything feels off at any point on the trip, our team is reachable 24/7. You are not alone on this trip — you have 11 other women who showed up for the same reason."),
        FAQItem(question: "What if I don't find a romantic connection?", answer: "Still a 6-day trip in the Himalayas with 23 interesting, vetted singles who chose to show up. Pilot batches reported deep friendships, clarity on what they want, and stories they're still telling. Romance is possible — it's not guaranteed, and that's intentional."),
        FAQItem(question: "Can I come with a friend?", answer: "Each person books their own slot. If you're both coming, yes — but we won't always room or group you together. The point is to meet the other 22 people, not hide in a bubble."),
        FAQItem(question: "I'm introverted — is this still for me?", answer: "Some of our strongest connections have been between people who don't love small talk. Activities are structured so nobody has to perform. There's free time, no forced participation, and the mountains do a lot of the work for you."),
        FAQItem(question: "What's included in the trip price?", answer: "Transport from Delhi, curated stays, most meals, ice-breaker activities, bonfire night, and the full batch experience. Exact inclusions vary slightly by batch — see each batch page for the line-item breakdown before you pay."),
        FAQItem(question: "What about refunds and cancellations?", answer: "Refund rules depend on how close you are to departure and whether we can fill your spot. Full policy is on our Cancellation & Refund page — read it before you pay so there are no surprises.")
    ]

    static let steps: [(String, String, String)] = [
        ("01", "Take the quiz", "12 questions — age first, then personality. Our AI builds your compatibility profile and shows your best batch fit."),
        ("02", "Book your slot", "Pick your Friday departure, pay on the website, and lock your spot. 12 women and 12 men — gender balance guaranteed."),
        ("03", "AI matches your batch", "The algorithm places you where your compatibility score is highest. You meet your group on Day 1 — that's intentional."),
        ("04", "Go to the mountains", "Manali → Sissu → Kasol. 5 nights, 6 days. Ice breakers, bonfires, real conversations. What happens next is entirely yours.")
    ]

    static let conceptStats: [(String, String, String)] = [
        ("24", "Verified singles per batch", "12 women · 12 men · always balanced."),
        ("2", "Batches every month", "GenZ edition & Millennial edition."),
        ("6", "Days in the Himalayas", "Manali · Kasol · Sissu."),
        ("60%", "Report something meaningful changed", "Romance, deep friendships, or just clarity. All real.")
    ]

    static let traitChips = ["Personality type", "Communication style", "Love language", "Life values & dreams", "Humour compatibility", "Ambition alignment", "Energy & pace of life", "Conflict style"]

    // MARK: Safety

    static let safetyFAQ: [FAQItem] = [
        FAQItem(question: "Who actually does the checking?", answer: "A real person on our team — not an algorithm, not a bot. Every applicant, by hand."),
        FAQItem(question: "What if I don't get in?", answer: "We'll tell you, and we'll refund you in full. The gate is real — that's what makes the room safe."),
        FAQItem(question: "Do men and women room together?", answer: "Never. Single-gender rooms, every trip, no exceptions."),
        FAQItem(question: "What if I don't click with anyone?", answer: "Then you go home with 23 new friends. Zero pressure to pair up — that was never the deal."),
        FAQItem(question: "Is my ID safe with you?", answer: "Used only to verify you, never shared or made public, and never part of a profile."),
        FAQItem(question: "Who's with us on the trip?", answer: "A female trip lead and captains, on the ground and reachable 24/7.")
    ]

    // MARK: Itineraries

    struct ItinDay: Identifiable, Hashable {
        let label: String       // "Day 0"
        let place: String       // "Delhi → Manali"
        let subtitle: String    // "Overnight journey"
        let bullets: [String]
        let meals: String?      // "Breakfast · Dinner"
        var id: String { label + place }
    }

    static let himalayanDays: [ItinDay] = [
        ItinDay(label: "Day 0", place: "Delhi → Manali", subtitle: "Overnight journey", bullets: [
            "Assemble at Delhi boarding point (Majnu Ka Tilla area — exact location shared 24h before departure)",
            "Meet your batch & trip lead on the bus",
            "Ice Breaker Round 1 — names, vibes, first impressions",
            "Overnight journey to Manali — socialise with co-travellers"
        ], meals: nil),
        ItinDay(label: "Day 1", place: "Manali", subtitle: "Arrival & local exploration", bullets: [
            "Arrive Manali — hotel check-in & freshen up",
            "Hadimba Devi Temple & Van Vihar forest walk",
            "Old Manali café hopping — Ice Breaker Round 2 (paired conversations)",
            "Mall Road evening — street food, shopping & people-watching",
            "Group dinner (assigned seating) · overnight in Manali"
        ], meals: "Dinner"),
        ItinDay(label: "Day 2", place: "Sissu & Solang", subtitle: "Day trip via Atal Tunnel", bullets: [
            "Breakfast at hotel",
            "Drive to Lahaul via Atal Tunnel — landscape shifts from Kullu to Lahaul",
            "Sissu village & Sissu Lake visit (weather permitting)",
            "Solang Valley stop — adventure activities (optional, at your own cost)",
            "Return to Manali — rooftop chai & group hangout",
            "Group dinner · overnight in Manali"
        ], meals: "Breakfast · Dinner"),
        ItinDay(label: "Day 3", place: "Kasol", subtitle: "Manali to Kasol · Parvati Valley", bullets: [
            "Breakfast, checkout & scenic drive Manali → Kasol",
            "En route: optional paragliding or rafting at Kullu (at your own cost)",
            "Check-in at Kasol hotel/campsite",
            "Chalal bridge walk & Parvati riverside chill",
            "Café hopping — paired evening activity",
            "BONFIRE NIGHT (weather permitting) — guitar, stories & stargazing",
            "Home-style group dinner · overnight in Kasol"
        ], meals: "Breakfast · Dinner"),
        ItinDay(label: "Day 4", place: "Manikaran → Delhi", subtitle: "Hot springs & overnight return", bullets: [
            "Breakfast & checkout from Kasol",
            "Manikaran Sahib Gurudwara — holy hot water springs & Shiva Temple",
            "Kasol local market — free time & last looks",
            "Ice Breaker Round 3 — final honesty round with the group",
            "Evening: start overnight journey back to Delhi"
        ], meals: "Breakfast"),
        ItinDay(label: "Day 5", place: "→ Delhi", subtitle: "Trip ends", bullets: [
            "Early morning arrival in Delhi",
            "Private group WhatsApp unlocked",
            "\"Whatever happens next is up to you.\""
        ], meals: nil)
    ]

    static let udaipurDays: [ItinDay] = [
        ItinDay(label: "Day 0", place: "Gurugram → Udaipur", subtitle: "The overnight journey", bullets: [
            "Assemble at the Gurugram boarding point (exact details shared 24 hours before departure)",
            "Settle onto a comfortable AC coach and leave overnight for Udaipur",
            "Easy hellos with your hand-matched batch — arrive already knowing a few faces"
        ], meals: nil),
        ItinDay(label: "Day 1", place: "Udaipur · City of Lakes", subtitle: "Lakes, bazaars & Bollywood night", bullets: [
            "Arrive Udaipur — hotel check-in & freshen up",
            "Saheliyon Ki Bari, Maharana Pratap Memorial & Under the Sun Aquarium",
            "Fatehsagar Lake sunset + street-food market",
            "The Bollywood House Party — themed, host-led, verified-guests-only and zero pressure",
            "Antakshari: Wingman Edition · Guess the Jodi · Filmy Charades · Two Truths, Filmy Style",
            "Group dinner · overnight in Udaipur"
        ], meals: "Dinner"),
        ItinDay(label: "Day 2", place: "Udaipur Old City", subtitle: "Palaces, ghats & lake-view cafés", bullets: [
            "Breakfast at hotel",
            "City Palace and Mewar history",
            "Jagdish Temple and Karni Mata Temple",
            "Bagore Ki Haveli folk-art show or café-hopping along Lake Pichola and Gangaur Ghat",
            "Paired café walks and thoughtfully seated group dinner for easy, real conversation",
            "Group dinner · overnight in Udaipur"
        ], meals: "Breakfast · Dinner"),
        ItinDay(label: "Day 3", place: "Kumbhalgarh → Gurugram", subtitle: "The Great Wall of India", bullets: [
            "Breakfast & checkout from hotel",
            "Drive to UNESCO-listed Kumbhalgarh Fort and walk its astonishing 38 km rampart",
            "A slow walk and sunset view — the final chance to see who you are drawn to",
            "Begin the overnight journey home"
        ], meals: "Breakfast"),
        ItinDay(label: "Day 4", place: "→ Gurugram", subtitle: "Home, with a new circle", bullets: [
            "Early morning arrival in Gurugram",
            "Your private, verified batch group stays open",
            "\"No forced matches, no reveal, no scores. Who you keep talking to is entirely up to you.\""
        ], meals: nil)
    ]

    static func days(for trip: ExploreTrip) -> [ItinDay] {
        trip == .himalayan ? himalayanDays : udaipurDays
    }

    static let outcomes: [(String, String, String)] = [
        ("♡", "23 people who still text back", "The batch becomes the group chat you actually reply to — long after the bus drops you home."),
        ("✦", "Maybe a spark", "Off-grid, no filter, no pressure. No promises — but if it's real, you'll both know it."),
        ("❤", "Stories you'll tell for years", "The bonfire, the 2am drive, the conversation you didn't want to end."),
        ("◈", "Clarity on what you want", "Even if the whole takeaway is just knowing what you're actually looking for.")
    ]

    static let outcomesNote = "No outcome is promised. In our pilot batches, most people came home with at least one of these — and often more than they expected."

    // MARK: Journal

    struct JournalPost: Identifiable, Hashable {
        let title: String
        let excerpt: String
        let tag: String
        let imageName: String
        var id: String { title }
    }

    static let journalPosts: [JournalPost] = [
        JournalPost(
            title: "Why Swiping Stopped Working: What Indian Singles Are Choosing Instead in 2026",
            excerpt: "Dating apps aren't dead — but millions of Indian singles are exhausted by them. Here's what they're trying next, and why shared experiences beat another coffee date.",
            tag: "Dating app fatigue",
            imageName: "himalayan-dating-apps-fatigue"
        ),
        JournalPost(
            title: "Not a Group Tour. Not Matrimony. What a Matchmaking Travel Club Actually Is",
            excerpt: "Confused about what a matchmaking travel club is? Here's the honest anatomy — screening, AI matching, designed events, and destinations from Himachal to festivals.",
            tag: "What we are",
            imageName: "himalayan-matchmaking-machine"
        ),
        JournalPost(
            title: "What Actually Happens on a Togetha Experience: Connection, Safety, and Real Pricing",
            excerpt: "Nervous about joining 23 strangers? Here's exactly how designed connection works, how we keep batches safe, and what you'll pay — pulled from live pricing.",
            tag: "Honest answers",
            imageName: "himalayan-campfire-friendships"
        )
    ]

    // MARK: Batch vibe / reviews / includes / policies

    struct VibeCard: Identifiable, Hashable {
        let title: String
        let body: String?
        var id: String { title }
    }

    struct BatchVibe {
        let label: String
        let heading: String
        let intro: [String]
        let cards: [VibeCard]
    }

    static func vibe(forBatch id: String) -> BatchVibe? {
        switch id {
        case "batch-a":
            return BatchVibe(
                label: "The Energy",
                heading: "GenZ Edition — what to expect.",
                intro: [
                    "You've been on Hinge for three years. You're exhausted. The dates feel like job interviews. The conversations die after 4 messages. You scroll past 50 people before breakfast. You want something real — but you don't want to admit it.",
                    "So we made this trip for you."
                ],
                cards: [
                    VibeCard(title: "Electric Energy", body: "GenZ moves fast. Our games and activities match that pace. Nothing is slow or boring."),
                    VibeCard(title: "Unscripted Moments", body: "We create conditions. The chaos is yours. You'll have stories you can't put in a caption."),
                    VibeCard(title: "Zero Pressure", body: "No roses, no eliminations. If something happens, it happens. If not, you made 23 great friends."),
                    VibeCard(title: "Real Settings", body: "Mountains strip pretense. By day 3 nobody is performing. That's when the real stuff starts."),
                    VibeCard(title: "Midnight Confessions", body: "The best conversations happen after midnight at altitude. We create space for those."),
                    VibeCard(title: "Low-Wifi, High-Vibe", body: "Patchy signal means actual eye contact. You'll notice you don't miss the phone.")
                ]
            )
        case "batch-b":
            return BatchVibe(
                label: "Who this is for",
                heading: "The Millennial Edition — a different pace.",
                intro: [
                    "You're 26–36. You have your life together — career, apartment, maybe even a car. The thing you don't have figured out is this. Dating in your 30s in India is strange. The apps feel beneath you. The arranged marriage pressure is exhausting. The people who \"get it\" seem impossible to find in normal life.",
                    "This trip is for you."
                ],
                cards: [
                    VibeCard(title: "Slower Pace", body: nil),
                    VibeCard(title: "Deeper Prompts", body: nil),
                    VibeCard(title: "The Letter Exchange", body: nil),
                    VibeCard(title: "No Performance", body: nil),
                    VibeCard(title: "Live Music", body: nil),
                    VibeCard(title: "Journaling Ritual", body: nil)
                ]
            )
        case "batch-d", "batch-e":
            return BatchVibe(
                label: "What this actually is",
                heading: "Not a dating app. Not a random group tour.",
                intro: [
                    "Take a short compatibility quiz, get matched into a balanced batch of 24 verified singles, and spend three days in the City of Lakes with people you are genuinely likely to click with.",
                    "No swiping, no ghosting, no performing for a profile — just real people in a real place, with everything planned for you."
                ],
                cards: [
                    VibeCard(title: "Safe by Design", body: nil),
                    VibeCard(title: "Matched, Not Random", body: nil),
                    VibeCard(title: "No Pressure", body: nil),
                    VibeCard(title: "A Better First Night", body: nil)
                ]
            )
        default:
            return nil
        }
    }

    struct Review: Identifiable, Hashable {
        let quote: String
        let byline: String
        var id: String { byline }
    }

    static let himalayanReviews: [Review] = [
        Review(quote: "I was the most skeptical person there. I literally told my roommate this was going to be cringe. By day 3 I was crying at a bonfire because someone finally got what I was saying. No cap.", byline: "Aryan K., 24 · Delhi · Batch Pilot '25"),
        Review(quote: "Met someone on Day 2. We didn't say anything to each other for two days. On Day 4 at the bonfire we stayed back after everyone left. We've been talking every day since. That's 3 months now.", byline: "Sneha R., 23 · Mumbai · Batch Pilot '25"),
        Review(quote: "The ice breaker games are unhinged. Like someone really thought hard about how to make 24 strangers actually talk to each other. Also the food was incredible somehow. 10/10 would go again.", byline: "Varun K., 26 · Bangalore · Batch Pilot '25")
    ]

    static let videoTestimonials: [(name: String, role: String, poster: String)] = [
        ("Ananya", "Content creator and Dancer · Kolkata", "poster-01"),
        ("Shrutika", "Digital Marketer · Delhi", "poster-02"),
        ("Bhumi", "Software Engineer · Bangalore", "poster-03")
    ]

    struct IncludesBlock {
        let heading: String
        let sub: String
        let items: [String]
    }

    static func includes(forBatch id: String) -> IncludesBlock? {
        switch id {
        case "batch-a", "batch-b":
            return IncludesBlock(heading: "In the box", sub: "Everything that makes it work.", items: [
                "Delhi–Delhi Transport", "3 Nights Accommodation", "6 Group Meals", "Experienced Trip Lead",
                "Bonfire & Music", "Road Taxes & Driver Allowances", "Ice Breaker Game Sets", "Identity Verification"
            ])
        case "batch-d", "batch-e":
            return IncludesBlock(heading: "In the box", sub: "Everything's handled. You just show up.", items: [
                "Return Travel from Gurugram", "2 Nights' Stay in Udaipur", "4 Group Meals",
                "The Bollywood House Party", "Trip Captains & Your Batch", "All Sightseeing on the Plan"
            ])
        default:
            return nil
        }
    }

    static let policies: [(String, String)] = [
        ("30+ days before departure", "Full refund minus ₹999 processing fee."),
        ("15–29 days before departure", "50% refund + option to transfer your slot."),
        ("Under 15 days", "No refund; transfers allowed up to 7 days out."),
        ("Verification failure", "Full refund in 5–7 business days."),
        ("Code of conduct", "Zero tolerance — one report of harassment ends the trip for that person."),
        ("Weather / force majeure", "Itinerary elements may shift for safety; we always tell you first.")
    ]

    // MARK: Mystery (batch-c)

    static let mysteryEyebrow = "✦ Something new — August 2026"
    static let mysteryTitle = "Mystery Destination"
    static let mysteryDrop = "✦ Details drop August 1st"
    static let mysteryDates = "Tentative dates: August 2026 — TBD\nTwo batches · 5 nights / 6 days"
    static let mysteryPrice = "Expected investment: ₹???,???\nPrice revealed with details on Aug 1st"
    static let mysteryClues: [(String, String?)] = [
        ("Water is involved", nil),
        ("The sunrise is the thing", "There's a specific moment on Day 3 we're building the whole trip around."),
        ("A new format", "Not just mountains. Not just bonfire. We're adding something we've never done before.")
    ]

    // MARK: About / footer

    static let footerTagline = "India's first matchmaking travel club. Like Hinge, but for travelers."
    static let copyrightLine = "© 2026 Togetha.Club · Made with ♡ for people who believe in the real thing"
}

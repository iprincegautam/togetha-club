package club.togetha.app.feature.site

/** Verbatim website copy keyed by batch id. */
object BatchContent {

    data class VibeCard(val title: String, val body: String? = null)
    data class Vibe(val label: String, val heading: String, val intro: List<String>, val cards: List<VibeCard>)
    data class Review(val quote: String, val who: String)
    data class Includes(val label: String, val heading: String, val items: List<String>)

    private val vibeA = Vibe(
        label = "The Energy",
        heading = "GenZ Edition — what to expect.",
        intro = listOf(
            "You've been on Hinge for three years. You're exhausted. The dates feel like job interviews. The conversations die after 4 messages. You scroll past 50 people before breakfast. You want something real — but you don't want to admit it.",
            "So we made this trip for you.",
        ),
        cards = listOf(
            VibeCard("Electric Energy", "GenZ moves fast. Our games and activities match that pace. Nothing is slow or boring."),
            VibeCard("Unscripted Moments", "We create conditions. The chaos is yours. You'll have stories you can't put in a caption."),
            VibeCard("Zero Pressure", "No roses, no eliminations. If something happens, it happens. If not, you made 23 great friends."),
            VibeCard("Real Settings", "Mountains strip pretense. By day 3 nobody is performing. That's when the real stuff starts."),
            VibeCard("Midnight Confessions", "The best conversations happen after midnight at altitude. We create space for those."),
            VibeCard("Low-Wifi, High-Vibe", "Patchy signal means actual eye contact. You'll notice you don't miss the phone."),
        ),
    )

    private val vibeB = Vibe(
        label = "Who this is for",
        heading = "The Millennial Edition — a different pace.",
        intro = listOf(
            "You're 26–36. You have your life together — career, apartment, maybe even a car. The thing you don't have figured out is this. Dating in your 30s in India is strange. The apps feel beneath you. The arranged marriage pressure is exhausting. The people who \"get it\" seem impossible to find in normal life.",
            "This trip is for you.",
        ),
        cards = listOf(
            VibeCard("Slower Pace"), VibeCard("Deeper Prompts"), VibeCard("The Letter Exchange"),
            VibeCard("No Performance"), VibeCard("Live Music"), VibeCard("Journaling Ritual"),
        ),
    )

    private val vibeUdaipur = Vibe(
        label = "What this actually is",
        heading = "Not a dating app. Not a random group tour.",
        intro = listOf(
            "Take a short compatibility quiz, get matched into a balanced batch of 24 verified singles, and spend three days in the City of Lakes with people you are genuinely likely to click with.",
            "No swiping, no ghosting, no performing for a profile — just real people in a real place, with everything planned for you.",
        ),
        cards = listOf(
            VibeCard("Safe by Design"), VibeCard("Matched, Not Random"),
            VibeCard("No Pressure"), VibeCard("A Better First Night"),
        ),
    )

    fun vibeFor(batchId: String): Vibe? = when (batchId) {
        "batch-a" -> vibeA
        "batch-b" -> vibeB
        "batch-d", "batch-e" -> vibeUdaipur
        else -> null
    }

    val himalayanReviews = listOf(
        Review(
            "I was the most skeptical person there. I literally told my roommate this was going to be cringe. By day 3 I was crying at a bonfire because someone finally got what I was saying. No cap.",
            "Aryan K., 24 · Delhi · Batch Pilot '25",
        ),
        Review(
            "Met someone on Day 2. We didn't say anything to each other for two days. On Day 4 at the bonfire we stayed back after everyone left. We've been talking every day since. That's 3 months now.",
            "Sneha R., 23 · Mumbai · Batch Pilot '25",
        ),
        Review(
            "The ice breaker games are unhinged. Like someone really thought hard about how to make 24 strangers actually talk to each other. Also the food was incredible somehow. 10/10 would go again.",
            "Varun K., 26 · Bangalore · Batch Pilot '25",
        ),
    )

    private val includesHimalayan = Includes(
        label = "In the box",
        heading = "Everything that makes it work.",
        items = listOf(
            "Delhi–Delhi Transport", "3 Nights Accommodation", "6 Group Meals", "Experienced Trip Lead",
            "Bonfire & Music", "Road Taxes & Driver Allowances", "Ice Breaker Game Sets", "Identity Verification",
        ),
    )

    private val includesUdaipur = Includes(
        label = "In the box",
        heading = "Everything's handled. You just show up.",
        items = listOf(
            "Return Travel from Gurugram", "2 Nights' Stay in Udaipur", "4 Group Meals",
            "The Bollywood House Party", "Trip Captains & Your Batch", "All Sightseeing on the Plan",
        ),
    )

    fun includesFor(batchId: String): Includes? = when (batchId) {
        "batch-a", "batch-b" -> includesHimalayan
        "batch-d", "batch-e" -> includesUdaipur
        else -> null
    }

    val policiesHeading = "Clear, fair, no surprises."
    val policies = listOf(
        "30+ days = full refund minus ₹999 processing fee",
        "15–29 days = 50% refund + transfer",
        "Under 15 days = no refund, transfer to 7 days out",
        "Verification failure = full refund 5–7 business days",
        "Code of conduct zero tolerance",
        "Weather / force majeure",
    )

    // Mystery Edition (batch-c)
    val mysteryEyebrow = "✦ Something new — August 2026"
    val mysteryTitle = "Mystery Destination"
    val mysteryStamp = "✦ Details drop August 1st"
    val mysteryDates = "Tentative dates: August 2026 — TBD\nTwo batches · 5 nights / 6 days"
    val mysteryPrice = "Expected investment: ₹???,???\nPrice revealed with details on Aug 1st"
    val mysteryClues = listOf(
        VibeCard("Water is involved"),
        VibeCard("The sunrise is the thing", "There's a specific moment on Day 3 we're building the whole trip around."),
        VibeCard("A new format", "Not just mountains. Not just bonfire. We're adding something we've never done before."),
    )
}

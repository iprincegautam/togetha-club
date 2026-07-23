import Foundation

/// The real 13-question Togetha curation quiz, verbatim from the production site.
/// Option weights feed the local MatchEngine's 12-dimension compatibility vector.
enum QuizData {

    static let questions: [QuizQuestion] = [
        QuizQuestion(
            id: "age", kind: .numeric,
            prompt: "How old are you?",
            subtitle: "GenZ Edition is for ages 18–25. Millennial Edition is for ages 26–36. This decides which batch you belong in."
        ),
        QuizQuestion(
            id: "destination", kind: .destination,
            prompt: "Which trail are you dreaming about?",
            subtitle: "Pick your trip. We'll show you its dates and read your fit for that batch.",
            options: [
                QuizOption(text: "Himalayan", weights: [.adventure: 0.9, .introspection: 0.6]),
                QuizOption(text: "Udaipur", weights: [.warmth: 0.7, .depth: 0.6])
            ]
        ),
        QuizQuestion(
            id: "profession", kind: .text,
            prompt: "What do you do?",
            subtitle: "Your work, field, or what you're building. It helps us place you with people you'll actually click with."
        ),
        QuizQuestion(
            id: "friday", kind: .choice,
            prompt: "It's Friday night. Your ideal version of this evening is...",
            subtitle: "Be honest. Nobody's watching.",
            options: [
                QuizOption(text: "Rooftop with loud music, 12 people, and chaos",
                           weights: [.socialEnergy: 0.95, .spontaneity: 0.8, .humor: 0.7]),
                QuizOption(text: "Cosy dinner with 3 people where the conversation hits 3am",
                           weights: [.depth: 0.95, .warmth: 0.8, .emotionalAvailability: 0.6]),
                QuizOption(text: "Solo walk with headphones and a playlist you'd die before sharing",
                           weights: [.introspection: 0.95, .authenticity: 0.7, .depth: 0.5]),
                QuizOption(text: "A bonfire. Wherever. With whoever. Just a bonfire.",
                           weights: [.warmth: 0.9, .spontaneity: 0.7, .adventure: 0.6])
            ]
        ),
        QuizQuestion(
            id: "party", kind: .choice,
            prompt: "You meet someone interesting at a party. You most likely...",
            subtitle: "Your actual instinct, not your aspirational self.",
            options: [
                QuizOption(text: "Make a joke to see if they laugh at the right things",
                           weights: [.humor: 0.95, .socialEnergy: 0.7, .curiosity: 0.5]),
                QuizOption(text: "Ask one very specific weird question and see how they handle it",
                           weights: [.curiosity: 0.95, .directness: 0.8, .depth: 0.6]),
                QuizOption(text: "Subtly find them on Instagram before talking to them",
                           weights: [.introspection: 0.7, .curiosity: 0.6, .socialEnergy: 0.3]),
                QuizOption(text: "Just talk. You're genuinely good at this.",
                           weights: [.directness: 0.9, .socialEnergy: 0.8, .warmth: 0.6])
            ]
        ),
        QuizQuestion(
            id: "controversial", kind: .choice,
            prompt: "Your most controversial opinion about relationships...",
            subtitle: "Pick the closest to something you'd actually say at 1am.",
            options: [
                QuizOption(text: "Love is a choice, not a feeling — every single day",
                           weights: [.loyalty: 0.95, .directness: 0.7, .depth: 0.6]),
                QuizOption(text: "Compatibility is overrated. Chemistry decides everything.",
                           weights: [.spontaneity: 0.9, .adventure: 0.6, .emotionalAvailability: 0.5]),
                QuizOption(text: "Most people settle because they're afraid. Including themselves.",
                           weights: [.directness: 0.95, .introspection: 0.8, .authenticity: 0.7]),
                QuizOption(text: "The best relationships start as really good friendships",
                           weights: [.warmth: 0.9, .loyalty: 0.8, .depth: 0.6])
            ]
        ),
        QuizQuestion(
            id: "travelPersonality", kind: .choice,
            prompt: "Pick your travel personality. Zero judgement.",
            subtitle: "",
            options: [
                QuizOption(text: "I plan everything. Itinerary. Backup itinerary. Emergency snacks.",
                           weights: [.loyalty: 0.9, .directness: 0.6, .introspection: 0.5]),
                QuizOption(text: "I book the flight and figure it out. This has gone wrong exactly once.",
                           weights: [.spontaneity: 0.95, .adventure: 0.8, .humor: 0.6]),
                QuizOption(text: "I go wherever the vibe takes me. Sometimes I don't know where I am.",
                           weights: [.spontaneity: 0.9, .socialEnergy: 0.6, .adventure: 0.7]),
                QuizOption(text: "I travel to understand, not just to see. There's a difference.",
                           weights: [.depth: 0.95, .curiosity: 0.9, .introspection: 0.7])
            ]
        ),
        QuizQuestion(
            id: "emotionalAvailability", kind: .range,
            prompt: "On a scale of 1–10, how emotionally available are you right now?",
            subtitle: "1 = need 6 months and a therapist · 10 = genuinely ready for something real"
        ),
        QuizQuestion(
            id: "wantMost", kind: .choice,
            prompt: "The thing you want most from the next person you're with...",
            subtitle: "One answer. Your gut answer.",
            options: [
                QuizOption(text: "Someone who makes ordinary days feel like something",
                           weights: [.warmth: 0.95, .depth: 0.7, .emotionalAvailability: 0.6]),
                QuizOption(text: "Someone who challenges me and isn't afraid of disagreement",
                           weights: [.directness: 0.95, .curiosity: 0.7, .depth: 0.6]),
                QuizOption(text: "Someone who feels like home — safe, warm, easy",
                           weights: [.loyalty: 0.9, .warmth: 0.85, .emotionalAvailability: 0.7]),
                QuizOption(text: "Someone who is as weird as I am, in exactly the right ways",
                           weights: [.authenticity: 0.95, .humor: 0.8, .curiosity: 0.6])
            ]
        ),
        QuizQuestion(
            id: "metaphor", kind: .text,
            prompt: "Describe yourself using only a metaphor. No adjectives.",
            subtitle: "\"I'm like a ___\" — make it actually mean something. We read every answer."
        ),
        QuizQuestion(
            id: "bonfire2am", kind: .choice,
            prompt: "2am on night three. Bonfire is dying. What are you doing?",
            subtitle: "The real you. Not the performed version.",
            options: [
                QuizOption(text: "Keeping the fire alive and making sure nobody sleeps yet",
                           weights: [.socialEnergy: 0.9, .warmth: 0.7, .loyalty: 0.6]),
                QuizOption(text: "In a deep one-on-one conversation that started two hours ago",
                           weights: [.depth: 0.95, .emotionalAvailability: 0.8, .warmth: 0.6]),
                QuizOption(text: "Walking alone by the river because you need to process everything",
                           weights: [.introspection: 0.95, .depth: 0.7, .authenticity: 0.6]),
                QuizOption(text: "Making everyone laugh one more time before the night ends",
                           weights: [.humor: 0.95, .socialEnergy: 0.8, .warmth: 0.6])
            ]
        ),
        QuizQuestion(
            id: "sunday", kind: .choice,
            prompt: "Your ideal Sunday morning looks like...",
            subtitle: "The kind of Sunday that actually restores you.",
            options: [
                QuizOption(text: "Farmers market, good coffee, and 3 hours of nothing",
                           weights: [.curiosity: 0.7, .warmth: 0.6, .introspection: 0.5]),
                QuizOption(text: "Still in bed at 11am talking about everything and nothing",
                           weights: [.warmth: 0.9, .depth: 0.7, .emotionalAvailability: 0.7]),
                QuizOption(text: "Long run or hike. Physical reset before the week.",
                           weights: [.adventure: 0.9, .directness: 0.5, .introspection: 0.6]),
                QuizOption(text: "Slow breakfast cooked at home. Music. Maybe someone else there.",
                           weights: [.warmth: 0.85, .loyalty: 0.7, .authenticity: 0.6])
            ]
        ),
        QuizQuestion(
            id: "mountains", kind: .text,
            prompt: "If the mountains could tell us one thing about you that you wouldn't say yourself — what would it be?",
            subtitle: "This is the question our AI weights most. Take your time."
        ),
        QuizQuestion(
            id: "departure", kind: .departure,
            prompt: "When are you planning to travel?",
            subtitle: "Pick the Friday departure that works for you. We run a new batch every week."
        )
    ]
}

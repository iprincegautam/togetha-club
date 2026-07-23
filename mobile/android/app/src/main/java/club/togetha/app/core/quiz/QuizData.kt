package club.togetha.app.core.quiz

import club.togetha.app.core.model.QuizQuestion
import club.togetha.app.core.model.QuizType

/** The real Togetha 13-question curation quiz — verbatim. */
object QuizData {

    val questions: List<QuizQuestion> = listOf(
        QuizQuestion(
            "q1", QuizType.NUMBER,
            "How old are you?",
            "GenZ Edition is for ages 18–25. Millennial Edition is for ages 26–36. This decides which batch you belong in.",
        ),
        QuizQuestion(
            "q2", QuizType.CHOICE,
            "Which trail are you dreaming about?",
            "Pick your trip. We'll show you its dates and read your fit for that batch.",
            listOf("Himalayan", "Udaipur"),
        ),
        QuizQuestion(
            "q3", QuizType.CHOICE,
            "It's Friday night. Your ideal version of this evening is...",
            "Be honest. Nobody's watching.",
            listOf(
                "Rooftop with loud music, 12 people, and chaos",
                "Cosy dinner with 3 people where the conversation hits 3am",
                "Solo walk with headphones and a playlist you'd die before sharing",
                "A bonfire. Wherever. With whoever. Just a bonfire.",
            ),
        ),
        QuizQuestion(
            "q4", QuizType.CHOICE,
            "You meet someone interesting at a party. You most likely...",
            "Your actual instinct, not your aspirational self.",
            listOf(
                "Make a joke to see if they laugh at the right things",
                "Ask one very specific weird question and see how they handle it",
                "Subtly find them on Instagram before talking to them",
                "Just talk. You're genuinely good at this.",
            ),
        ),
        QuizQuestion(
            "q5", QuizType.CHOICE,
            "Your most controversial opinion about relationships...",
            "Pick the closest to something you'd actually say at 1am.",
            listOf(
                "Love is a choice, not a feeling — every single day",
                "Compatibility is overrated. Chemistry decides everything.",
                "Most people settle because they're afraid. Including themselves.",
                "The best relationships start as really good friendships.",
            ),
        ),
        QuizQuestion(
            "q6", QuizType.CHOICE,
            "Pick your travel personality. Zero judgement.",
            "",
            listOf(
                "I plan everything. Itinerary. Backup itinerary. Emergency snacks.",
                "I book the flight and figure it out. This has gone wrong exactly once.",
                "I go wherever the vibe takes me. Sometimes I don't know where I am.",
                "I travel to understand, not just to see. There's a difference.",
            ),
        ),
        QuizQuestion(
            "q7", QuizType.SLIDER,
            "On a scale of 1–10, how emotionally available are you right now?",
            "1 = need 6 months and a therapist · 10 = genuinely ready for something real",
        ),
        QuizQuestion(
            "q8", QuizType.CHOICE,
            "The thing you want most from the next person you're with...",
            "One answer. Your gut answer.",
            listOf(
                "Someone who makes ordinary days feel like something",
                "Someone who challenges me and isn't afraid of disagreement",
                "Someone who feels like home — safe, warm, easy",
                "Someone who is as weird as I am, in exactly the right ways",
            ),
        ),
        QuizQuestion(
            "q9", QuizType.TEXT,
            "Describe yourself using only a metaphor. No adjectives.",
            "\"I'm like a ___\" — make it actually mean something. We read every answer.",
        ),
        QuizQuestion(
            "q10", QuizType.CHOICE,
            "2am on night three. Bonfire is dying. What are you doing?",
            "The real you. Not the performed version.",
            listOf(
                "Keeping the fire alive and making sure nobody sleeps yet",
                "In a deep one-on-one conversation that started two hours ago",
                "Walking alone by the river because you need to process everything",
                "Making everyone laugh one more time before the night ends",
            ),
        ),
        QuizQuestion(
            "q11", QuizType.CHOICE,
            "Your ideal Sunday morning looks like...",
            "The kind of Sunday that actually restores you.",
            listOf(
                "Farmers market, good coffee, and 3 hours of nothing",
                "Still in bed at 11am talking about everything and nothing",
                "Long run or hike. Physical reset before the week.",
                "Slow breakfast cooked at home. Music. Maybe someone else there.",
            ),
        ),
        QuizQuestion(
            "q12", QuizType.TEXT,
            "If the mountains could tell us one thing about you that you wouldn't say yourself — what would it be?",
            "This is the question our AI weights most. Take your time.",
        ),
        QuizQuestion(
            "q13", QuizType.DEPARTURE,
            "When are you planning to travel?",
            "Pick the Friday departure that works for you. We run a new batch every week.",
        ),
    )
}

package club.togetha.app.core.match

import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * Deterministic, on-device match engine.
 * Quiz answers → a 12-dimension personality vector → cosine similarity against
 * a batch ideal vector → a bounded match score plus an archetype.
 */
object MatchEngine {

    // Dimension order (index into every vector):
    // 0 socialEnergy, 1 directness, 2 depth, 3 spontaneity, 4 emotionalAvailability,
    // 5 warmth, 6 humor, 7 adventure, 8 introspection, 9 loyalty, 10 curiosity, 11 authenticity
    const val DIMS = 12

    data class MatchResult(
        val score: Int,
        val archetype: String,
        val archetypeLine: String,
        val vector: FloatArray,
        val tier: String, // "high" | "medium" | "growing"
        val narrative: String,
    )

    private fun v(vararg pairs: Pair<Int, Float>): FloatArray {
        val arr = FloatArray(DIMS) { 0.3f }
        pairs.forEach { (i, value) -> arr[i] = value }
        return arr
    }

    // Weighted option vectors per choice question, indexed by option position.
    private val optionWeights: Map<String, List<FloatArray>> = mapOf(
        "q3" to listOf(
            v(0 to 0.95f, 6 to 0.7f, 3 to 0.7f),                    // rooftop chaos
            v(2 to 0.95f, 5 to 0.8f, 4 to 0.7f, 0 to 0.45f),        // cosy dinner till 3am
            v(8 to 0.95f, 10 to 0.6f, 0 to 0.15f),                  // solo walk
            v(5 to 0.85f, 7 to 0.7f, 0 to 0.65f, 11 to 0.7f),       // just a bonfire
        ),
        "q4" to listOf(
            v(6 to 0.95f, 1 to 0.6f, 0 to 0.7f),                    // joke test
            v(10 to 0.95f, 1 to 0.8f, 2 to 0.7f),                   // weird question
            v(8 to 0.7f, 10 to 0.65f, 0 to 0.25f),                  // instagram scout
            v(0 to 0.9f, 5 to 0.75f, 11 to 0.75f),                  // just talk
        ),
        "q5" to listOf(
            v(9 to 0.95f, 1 to 0.7f, 2 to 0.7f),                    // love is a choice
            v(3 to 0.85f, 7 to 0.7f, 1 to 0.6f),                    // chemistry decides
            v(1 to 0.95f, 2 to 0.8f, 8 to 0.7f),                    // people settle
            v(5 to 0.9f, 9 to 0.8f, 4 to 0.6f),                     // friendships first
        ),
        "q6" to listOf(
            v(9 to 0.8f, 1 to 0.6f, 3 to 0.1f),                     // plans everything
            v(3 to 0.9f, 7 to 0.85f, 6 to 0.6f),                    // book and figure out
            v(3 to 0.95f, 7 to 0.8f, 0 to 0.6f),                    // vibe-led
            v(2 to 0.9f, 8 to 0.85f, 10 to 0.85f),                  // travel to understand
        ),
        "q8" to listOf(
            v(5 to 0.9f, 2 to 0.7f, 4 to 0.7f),                     // ordinary days
            v(1 to 0.9f, 10 to 0.75f, 2 to 0.7f),                   // challenges me
            v(5 to 0.95f, 9 to 0.85f, 4 to 0.75f),                  // feels like home
            v(6 to 0.85f, 11 to 0.9f, 10 to 0.7f),                  // as weird as I am
        ),
        "q10" to listOf(
            v(0 to 0.95f, 5 to 0.7f, 9 to 0.6f),                    // keeping fire alive
            v(2 to 0.95f, 4 to 0.8f, 8 to 0.6f),                    // deep one-on-one
            v(8 to 0.95f, 10 to 0.6f, 2 to 0.6f),                   // walking alone
            v(6 to 0.95f, 0 to 0.8f, 5 to 0.7f),                    // one more laugh
        ),
        "q11" to listOf(
            v(3 to 0.5f, 10 to 0.6f, 8 to 0.6f),                    // farmers market
            v(5 to 0.9f, 4 to 0.8f, 2 to 0.7f),                     // in bed talking
            v(7 to 0.9f, 1 to 0.6f, 0 to 0.5f),                     // long run
            v(5 to 0.85f, 9 to 0.7f, 11 to 0.7f),                   // slow breakfast
        ),
    )

    // Batch ideal vectors — what each trail's group chemistry optimises for.
    private val himalayanIdeal = FloatArray(DIMS).also {
        floatArrayOf(0.7f, 0.6f, 0.85f, 0.75f, 0.8f, 0.8f, 0.65f, 0.9f, 0.7f, 0.7f, 0.75f, 0.85f)
            .copyInto(it)
    }
    private val udaipurIdeal = FloatArray(DIMS).also {
        floatArrayOf(0.75f, 0.6f, 0.8f, 0.6f, 0.8f, 0.9f, 0.75f, 0.6f, 0.6f, 0.8f, 0.75f, 0.85f)
            .copyInto(it)
    }

    private data class Archetype(val name: String, val line: String, val ideal: FloatArray)

    private val archetypes = listOf(
        Archetype("The Bonfire Romantic", "Warm, present, and at their best when the night slows down.", v(5 to 1f, 2 to 0.9f, 4 to 0.8f, 9 to 0.7f)),
        Archetype("The Chaos Catalyst", "The energy the trip remembers. Sparks fly where they stand.", v(0 to 1f, 6 to 0.9f, 3 to 0.85f)),
        Archetype("The Thoughtful Planner", "Steady hands, deep loyalty, and a backup itinerary.", v(9 to 1f, 1 to 0.85f, 2 to 0.7f)),
        Archetype("The Free Spirit", "Vibe-led, road-tested, allergic to rigid plans.", v(3 to 1f, 7 to 0.9f, 0 to 0.6f)),
        Archetype("The Quiet Intensity", "Says less, means more. The river-walk conversations.", v(8 to 1f, 2 to 0.9f, 10 to 0.7f)),
        Archetype("The Golden Retriever", "Openly warm, easy to be around, impossible to dislike.", v(5 to 1f, 6 to 0.85f, 0 to 0.8f, 11 to 0.7f)),
    )

    /** answers: quizId → raw answer (option text for choices, number for slider/age, free text). */
    fun buildVector(answers: Map<String, String>, questionOptions: Map<String, List<String>>): FloatArray {
        val acc = FloatArray(DIMS)
        val counts = FloatArray(DIMS)
        optionWeights.forEach { (qid, weights) ->
            val chosen = answers[qid] ?: return@forEach
            val idx = questionOptions[qid]?.indexOf(chosen) ?: -1
            if (idx in weights.indices) {
                val w = weights[idx]
                for (i in 0 until DIMS) {
                    if (w[i] > 0.3f) { acc[i] += w[i]; counts[i] += 1f }
                }
            }
        }
        val vec = FloatArray(DIMS) { i -> if (counts[i] > 0) acc[i] / counts[i] else 0.45f }
        // Slider → emotional availability.
        answers["q7"]?.toFloatOrNull()?.let { vec[4] = (it / 10f).coerceIn(0.1f, 1f) }
        // Text answers → curiosity + authenticity, by effort.
        val textScore = listOf("q9", "q12").map { qid ->
            val len = (answers[qid] ?: "").trim().length
            when {
                len >= 80 -> 0.95f
                len < 5 -> 0.35f
                else -> 0.35f + 0.6f * (len / 80f)
            }
        }
        vec[10] = maxOf(vec[10], textScore.average().toFloat())
        vec[11] = maxOf(vec[11], textScore.max())
        return vec
    }

    private fun cosine(a: FloatArray, b: FloatArray): Float {
        var dot = 0f; var na = 0f; var nb = 0f
        for (i in 0 until DIMS) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
        val denom = sqrt(na) * sqrt(nb)
        return if (denom == 0f) 0f else dot / denom
    }

    fun match(
        answers: Map<String, String>,
        questionOptions: Map<String, List<String>>,
        destination: String,      // "Himalayan" | "Udaipur"
        age: Int?,
        batchName: String,
        ageInBand: Boolean,
    ): MatchResult {
        val user = buildVector(answers, questionOptions)
        val ideal = if (destination == "Udaipur") udaipurIdeal else himalayanIdeal
        val authenticity = user[11]
        var score = (cosine(user, ideal) * 88 + authenticity * 9).roundToInt().coerceIn(68, 97)
        if (age != null && !ageInBand) score = minOf(score, 62)
        val archetype = archetypes.maxBy { cosine(user, it.ideal) }
        val tier = when {
            score >= 85 -> "high"
            score >= 76 -> "medium"
            else -> "growing"
        }
        return MatchResult(
            score = score,
            archetype = archetype.name,
            archetypeLine = archetype.line,
            vector = user,
            tier = tier,
            narrative = "Strong fit for $batchName. Our AI likes this pairing.",
        )
    }
}

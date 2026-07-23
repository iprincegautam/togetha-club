package club.togetha.app.core.state

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.datastore.preferences.core.edit
import club.togetha.app.Prefs
import club.togetha.app.core.match.MatchEngine
import club.togetha.app.core.model.VerificationStatus
import club.togetha.app.dataStore
import kotlinx.coroutines.flow.first
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Observable app-wide state (quiz result + verification), persisted in DataStore.
 * Load once at startup; composables read the snapshot state directly.
 */
object AppState {

    var quizCompleted by mutableStateOf(false)
        private set
    var quizAnswers by mutableStateOf<Map<String, String>>(emptyMap())
        private set
    var quizScore by mutableStateOf<Int?>(null)
        private set
    var quizArchetype by mutableStateOf("")
        private set
    var quizArchetypeLine by mutableStateOf("")
        private set
    var quizTier by mutableStateOf("")
        private set
    var recommendedBatchId by mutableStateOf<String?>(null)
        private set
    var verification by mutableStateOf(VerificationStatus.UNVERIFIED)
        private set

    /** Observable session flag. Logging out flips this false but keeps quiz data. */
    var signedIn by mutableStateOf(false)
        private set

    val isVerified: Boolean get() = verification == VerificationStatus.VERIFIED

    /** "genz" (18–25) / "millennial" (26–36) / "other" — null until the quiz is done. */
    val ageBand: String?
        get() {
            if (!quizCompleted) return null
            val age = quizAnswers["q1"]?.toIntOrNull() ?: return null
            return when (age) {
                in 18..25 -> "genz"
                in 26..36 -> "millennial"
                else -> "other"
            }
        }

    /** Batch ids this member's edition maps to; null means show everything. */
    val editionBatchIds: Set<String>?
        get() = when (ageBand) {
            "genz" -> setOf("batch-a", "batch-d")
            "millennial" -> setOf("batch-b", "batch-e")
            else -> null
        }

    private val json = Json { ignoreUnknownKeys = true }

    suspend fun load(context: Context) {
        val prefs = context.dataStore.data.first()
        quizCompleted = prefs[Prefs.QUIZ_COMPLETED] ?: false
        quizAnswers = prefs[Prefs.QUIZ_ANSWERS]?.let {
            runCatching { json.decodeFromString<Map<String, String>>(it) }.getOrDefault(emptyMap())
        } ?: emptyMap()
        quizScore = prefs[Prefs.QUIZ_SCORE]
        quizArchetype = prefs[Prefs.QUIZ_ARCHETYPE] ?: ""
        quizArchetypeLine = prefs[Prefs.QUIZ_ARCHETYPE_LINE] ?: ""
        quizTier = prefs[Prefs.QUIZ_TIER] ?: ""
        recommendedBatchId = prefs[Prefs.QUIZ_BATCH_ID]
        signedIn = prefs[Prefs.SIGNED_IN] ?: false
        verification = prefs[Prefs.VERIFICATION_STATUS]
            ?.let { v -> VerificationStatus.entries.firstOrNull { it.name == v } }
            ?: VerificationStatus.UNVERIFIED
    }

    suspend fun saveQuiz(
        context: Context,
        answers: Map<String, String>,
        result: MatchEngine.MatchResult,
        batchId: String?,
    ) {
        quizCompleted = true
        quizAnswers = answers
        quizScore = result.score
        quizArchetype = result.archetype
        quizArchetypeLine = result.archetypeLine
        quizTier = result.tier
        recommendedBatchId = batchId
        context.dataStore.edit {
            it[Prefs.QUIZ_COMPLETED] = true
            it[Prefs.QUIZ_ANSWERS] = json.encodeToString(answers)
            it[Prefs.QUIZ_SCORE] = result.score
            it[Prefs.QUIZ_ARCHETYPE] = result.archetype
            it[Prefs.QUIZ_ARCHETYPE_LINE] = result.archetypeLine
            it[Prefs.QUIZ_TIER] = result.tier
            batchId?.let { id -> it[Prefs.QUIZ_BATCH_ID] = id }
        }
    }

    /** Sign in/out. Quiz + verification data is deliberately kept on log out. */
    suspend fun setSignedIn(context: Context, value: Boolean) {
        signedIn = value
        context.dataStore.edit { it[Prefs.SIGNED_IN] = value }
    }

    suspend fun setVerification(context: Context, status: VerificationStatus) {
        verification = status
        context.dataStore.edit { it[Prefs.VERIFICATION_STATUS] = status.name }
    }
}

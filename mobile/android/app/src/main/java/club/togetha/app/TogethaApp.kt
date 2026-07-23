package club.togetha.app

import android.app.Application
import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "togetha_prefs")

object Prefs {
    val ONBOARDING_DONE = booleanPreferencesKey("onboarding_done")
    val SIGNED_IN = booleanPreferencesKey("signed_in")
    val QUIZ_COMPLETED = booleanPreferencesKey("quiz_completed")
    val QUIZ_ANSWERS = stringPreferencesKey("quiz_answers")
    val QUIZ_SCORE = intPreferencesKey("quiz_score")
    val QUIZ_ARCHETYPE = stringPreferencesKey("quiz_archetype")
    val QUIZ_ARCHETYPE_LINE = stringPreferencesKey("quiz_archetype_line")
    val QUIZ_TIER = stringPreferencesKey("quiz_tier")
    val QUIZ_BATCH_ID = stringPreferencesKey("quiz_batch_id")
    val VERIFICATION_STATUS = stringPreferencesKey("verification_status")

    fun onboardingDone(context: Context): Flow<Boolean> =
        context.dataStore.data.map { it[ONBOARDING_DONE] ?: false }

    suspend fun setOnboardingDone(context: Context) {
        context.dataStore.edit { it[ONBOARDING_DONE] = true }
    }

    suspend fun signedIn(context: Context): Boolean =
        context.dataStore.data.first()[SIGNED_IN] ?: false

    suspend fun setSignedIn(context: Context) {
        context.dataStore.edit { it[SIGNED_IN] = true }
    }
}

class TogethaApp : Application()

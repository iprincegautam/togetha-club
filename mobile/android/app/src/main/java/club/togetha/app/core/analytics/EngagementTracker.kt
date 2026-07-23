package club.togetha.app.core.analytics

import android.content.Context
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalContext
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import club.togetha.app.core.api.Api
import club.togetha.app.core.model.AnalyticsEvent
import club.togetha.app.dataStore
import java.util.UUID
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * Lightweight engagement tracking: a stable per-install session id (DataStore)
 * plus fire-and-forget events batched through ApiClient.trackEvents.
 */
object EngagementTracker {

    private const val TAG = "Engagement"
    private val SESSION_KEY = stringPreferencesKey("session_id")
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    @Volatile private var sessionId: String = "pending"

    fun init(context: Context) {
        val appContext = context.applicationContext
        scope.launch {
            val existing = appContext.dataStore.data.first()[SESSION_KEY]
            sessionId = existing ?: UUID.randomUUID().toString().also { fresh ->
                appContext.dataStore.edit { it[SESSION_KEY] = fresh }
            }
            Log.d(TAG, "session_id=$sessionId")
        }
    }

    fun track(name: String, props: Map<String, String> = emptyMap()) {
        val event = AnalyticsEvent(sessionId, name, props, System.currentTimeMillis())
        scope.launch {
            runCatching { Api.client.trackEvents(listOf(event)) }
                .onFailure { Log.d(TAG, "drop $name: ${it.message}") }
        }
    }

    fun listingView(batchId: String) = track("listing_view", mapOf("batch_id" to batchId))
    fun listingClick(batchId: String) = track("listing_click", mapOf("batch_id" to batchId))
    fun quizStart() = track("quiz_start")
    fun applyStart(batchId: String) = track("apply_start", mapOf("batch_id" to batchId))
}

/** Records a screen_view with dwell seconds when the composable leaves composition. */
@Composable
fun TrackScreen(name: String) {
    val context = LocalContext.current
    DisposableEffect(name) {
        EngagementTracker.init(context)
        val entered = System.currentTimeMillis()
        onDispose {
            val dwellSec = ((System.currentTimeMillis() - entered) / 1000).toString()
            EngagementTracker.track("screen_view", mapOf("screen" to name, "dwell_seconds" to dwellSec))
        }
    }
}

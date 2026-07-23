package club.togetha.app.feature.account

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.model.Batch
import club.togetha.app.core.state.AppState
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Forest
import club.togetha.app.ui.theme.OffWhite
import club.togetha.app.ui.theme.Radii

@Composable
fun QuizProfileScreen(onBack: () -> Unit, onEditQuiz: () -> Unit) {
    TrackScreen("quiz_profile")
    var batch by remember { mutableStateOf<Batch?>(null) }
    LaunchedEffect(AppState.recommendedBatchId) {
        batch = AppState.recommendedBatchId?.let { id ->
            Api.client.fetchBatches().firstOrNull { it.id == id }
        }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("My quiz & compatibility", style = MaterialTheme.typography.headlineMedium)
        }
        Spacer(Modifier.height(16.dp))

        if (!AppState.quizCompleted) {
            Text(
                "You haven't taken the quiz yet — it decides which edition you belong in.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))
            PrimaryButton("Check my fit →", onClick = onEditQuiz, modifier = Modifier.fillMaxWidth())
            return
        }

        Box(
            Modifier.size(120.dp).border(6.dp, Amber, CircleShape).align(Alignment.CenterHorizontally),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                "${AppState.quizScore ?: 0}%",
                style = MaterialTheme.typography.displayMedium,
                color = Amber,
            )
        }
        Spacer(Modifier.height(20.dp))

        Card(
            shape = RoundedCornerShape(Radii.card),
            colors = CardDefaults.cardColors(containerColor = Forest),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(20.dp)) {
                Text("YOUR ARCHETYPE", style = MaterialTheme.typography.labelSmall, color = Amber)
                Spacer(Modifier.height(6.dp))
                Text(AppState.quizArchetype, style = MaterialTheme.typography.headlineMedium, color = OffWhite)
                if (AppState.quizArchetypeLine.isNotBlank()) {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        AppState.quizArchetypeLine,
                        style = MaterialTheme.typography.bodyMedium,
                        color = OffWhite.copy(alpha = 0.85f),
                    )
                }
            }
        }
        Spacer(Modifier.height(14.dp))

        Card(shape = RoundedCornerShape(Radii.card), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(20.dp)) {
                Text("YOUR EDITION", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(6.dp))
                Text(
                    when (AppState.ageBand) {
                        "genz" -> "GenZ Edition · ages 18–25"
                        "millennial" -> "Millennial Edition · ages 26–36"
                        else -> "Outside our current editions (18–36)"
                    },
                    style = MaterialTheme.typography.titleMedium,
                )
                val b = batch
                if (b != null) {
                    Spacer(Modifier.height(12.dp))
                    Text("RECOMMENDED BATCH", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(6.dp))
                    Text(b.name, style = MaterialTheme.typography.titleMedium)
                    Text(
                        "${b.route} · ${b.duration} · ages ${b.ageBand}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
        Spacer(Modifier.height(24.dp))
        PrimaryButton("Edit my answers", onClick = onEditQuiz, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        Text(
            "Editing re-runs the quiz with your answers filled in — your score and batch update when you finish.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(40.dp))
    }
}

package club.togetha.app.feature.quiz

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.EngagementTracker
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.match.MatchEngine
import club.togetha.app.core.model.Batch
import club.togetha.app.core.model.QuizQuestion
import club.togetha.app.core.model.QuizType
import club.togetha.app.core.quiz.QuizData
import club.togetha.app.core.state.AppState
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Forest
import club.togetha.app.ui.theme.Motion
import club.togetha.app.ui.theme.OffWhite
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import kotlin.math.roundToInt
import kotlinx.coroutines.launch

@Composable
fun QuizScreen(
    onBack: () -> Unit,
    onApply: (String) -> Unit,
    mode: String = "edit",       // "onboarding" | "edit"
    onDone: () -> Unit = onBack,
) {
    TrackScreen("quiz")
    LaunchedEffect(Unit) { EngagementTracker.quizStart() }
    val context = androidx.compose.ui.platform.LocalContext.current

    val questions = QuizData.questions
    var index by remember { mutableIntStateOf(0) }
    val answers = remember {
        mutableStateMapOf<String, String>().apply { putAll(AppState.quizAnswers) }
    }
    var submitting by remember { mutableStateOf(false) }
    var result by remember { mutableStateOf<MatchEngine.MatchResult?>(null) }
    var recommended by remember { mutableStateOf<Batch?>(null) }
    var batches by remember { mutableStateOf<List<Batch>>(emptyList()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) { batches = Api.client.fetchBatches() }

    result?.let { r ->
        MatchResultScreen(
            r, recommended,
            onApply = { recommended?.let { onApply(it.id) } },
            onDone = onDone,
            doneLabel = if (mode == "onboarding") "Explore the club first →" else "Done",
        )
        return
    }

    val progress by animateFloatAsState(
        targetValue = (index + 1).toFloat() / questions.size,
        animationSpec = Motion.springBase(),
        label = "quizProgress",
    )

    Column(Modifier.fillMaxSize().padding(20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { if (index > 0) index-- else onBack() }) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
            }
            Text(
                "Question ${index + 1} of ${questions.size}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth().height(6.dp),
            color = Amber,
            trackColor = MaterialTheme.colorScheme.surfaceVariant,
        )
        Spacer(Modifier.height(24.dp))

        AnimatedContent(
            targetState = index,
            transitionSpec = {
                val forward = targetState >= initialState
                (slideInHorizontally(Motion.springBase()) { if (forward) it / 2 else -it / 2 } + fadeIn()) togetherWith
                    (slideOutHorizontally(Motion.springBase()) { if (forward) -it / 2 else it / 2 } + fadeOut())
            },
            label = "question",
            modifier = Modifier.weight(1f),
        ) { i ->
            QuestionBody(
                q = questions[i],
                answer = answers[questions[i].id],
                departureBatch = recommendedBatch(batches, answers),
                onAnswer = { answers[questions[i].id] = it },
            )
        }

        val current = questions[index]
        val answered = !answers[current.id].isNullOrBlank()
        PrimaryButton(
            text = if (index == questions.lastIndex) "See my match" else "Next",
            enabled = answered && !submitting,
            onClick = {
                if (index < questions.lastIndex) index++
                else {
                    submitting = true
                    scope.launch {
                        Api.client.submitQuiz(answers.toMap())
                        val rec = recommendedBatch(batches, answers)
                        val age = answers["q1"]?.toIntOrNull()
                        recommended = rec
                        val r = MatchEngine.match(
                            answers = answers.toMap(),
                            questionOptions = questions.associate { it.id to it.options },
                            destination = answers["q2"] ?: "Himalayan",
                            age = age,
                            batchName = rec?.name ?: "your batch",
                            ageInBand = rec != null && age != null && age in rec.ageMin..rec.ageMax,
                        )
                        AppState.saveQuiz(context, answers.toMap(), r, rec?.id)
                        result = r
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(10.dp))
        Text(
            "This decides your batch — it's curation, not a score.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        )
    }
}

/** Edition by destination (q2) + age (q1). */
private fun recommendedBatch(batches: List<Batch>, answers: Map<String, String>): Batch? {
    if (batches.isEmpty()) return null
    val destination = answers["q2"] ?: "Himalayan"
    val age = answers["q1"]?.toIntOrNull() ?: 24
    val genZ = age <= 25
    val id = when {
        destination == "Udaipur" && genZ -> "batch-d"
        destination == "Udaipur" -> "batch-e"
        genZ -> "batch-a"
        else -> "batch-b"
    }
    return batches.firstOrNull { it.id == id }
}

@Composable
private fun QuestionBody(q: QuizQuestion, answer: String?, departureBatch: Batch?, onAnswer: (String) -> Unit) {
    Column(Modifier.verticalScroll(rememberScrollState())) {
        Text(q.question, style = MaterialTheme.typography.displayMedium, maxLines = 4, overflow = TextOverflow.Ellipsis)
        if (q.subtitle.isNotBlank()) {
            Spacer(Modifier.height(8.dp))
            Text(q.subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(20.dp))
        when (q.type) {
            QuizType.NUMBER -> OutlinedTextField(
                value = answer.orEmpty(),
                onValueChange = { raw ->
                    val digits = raw.filter(Char::isDigit).take(2)
                    onAnswer(digits.toIntOrNull()?.coerceIn(if (digits.length == 2) 18 else 1, 99)?.toString() ?: digits)
                },
                label = { Text("Your age (18–99)") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
            )
            QuizType.SLIDER -> {
                val value = answer?.toFloatOrNull() ?: 5f
                Text(
                    value.roundToInt().toString(),
                    style = MaterialTheme.typography.displayLarge,
                    color = Amber,
                    modifier = Modifier.align(Alignment.CenterHorizontally),
                )
                Slider(
                    value = value,
                    onValueChange = { onAnswer(it.roundToInt().toString()) },
                    valueRange = 1f..10f,
                    steps = 8,
                    colors = SliderDefaults.colors(thumbColor = Amber, activeTrackColor = Amber),
                )
            }
            QuizType.TEXT -> OutlinedTextField(
                value = answer.orEmpty(),
                onValueChange = onAnswer,
                placeholder = { Text("Take your time…") },
                modifier = Modifier.fillMaxWidth().height(140.dp),
            )
            QuizType.DEPARTURE -> {
                val departures = departureBatch?.departures.orEmpty()
                if (departures.isEmpty()) {
                    Text("Answer the age and trail questions first — they decide your batch.", style = MaterialTheme.typography.bodyMedium)
                } else {
                    departureBatch?.let {
                        Text(it.name, style = MaterialTheme.typography.titleSmall, color = Success)
                        Spacer(Modifier.height(8.dp))
                    }
                    departures.forEach { d ->
                        OptionCard(
                            text = "${d.date}   ·   ${d.womenLeft}W / ${d.menLeft}M left",
                            selected = answer == d.date,
                            onClick = { onAnswer(d.date) },
                        )
                    }
                }
            }
            QuizType.CHOICE -> q.options.forEach { option ->
                OptionCard(text = option, selected = answer == option, onClick = { onAnswer(option) })
            }
        }
        Spacer(Modifier.height(12.dp))
    }
}

@Composable
private fun OptionCard(text: String, selected: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .border(
                width = if (selected) 2.dp else 1.dp,
                color = if (selected) Amber else MaterialTheme.colorScheme.outline,
                shape = RoundedCornerShape(Radii.button),
            )
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(Radii.button),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) Amber.copy(alpha = 0.12f) else Color.Transparent,
        ),
    ) {
        Text(text, modifier = Modifier.padding(16.dp), style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun MatchResultScreen(
    r: MatchEngine.MatchResult,
    batch: Batch?,
    onApply: () -> Unit,
    onDone: () -> Unit = {},
    doneLabel: String = "Done",
) {
    TrackScreen("quiz_result")
    val animatedScore by animateFloatAsState(r.score.toFloat(), Motion.springBase(), label = "score")
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(24.dp))
        Icon(Icons.Filled.AutoAwesome, null, tint = Amber, modifier = Modifier.size(32.dp))
        Spacer(Modifier.height(12.dp))
        Text("Your match read", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(20.dp))
        Box(
            Modifier.size(140.dp).border(6.dp, Amber, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text("${animatedScore.roundToInt()}%", style = MaterialTheme.typography.displayLarge, color = Amber, maxLines = 1)
        }
        Spacer(Modifier.height(8.dp))
        Surface(shape = RoundedCornerShape(999.dp), color = when (r.tier) {
            "high" -> Success.copy(alpha = 0.16f)
            "medium" -> Amber.copy(alpha = 0.16f)
            else -> MaterialTheme.colorScheme.surfaceVariant
        }) {
            Text(
                when (r.tier) {
                    "high" -> "High compatibility"
                    "medium" -> "Solid compatibility"
                    else -> "Growing fit"
                },
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                style = MaterialTheme.typography.labelMedium,
                color = if (r.tier == "high") Success else MaterialTheme.colorScheme.onSurface,
            )
        }
        Spacer(Modifier.height(24.dp))
        Card(
            shape = RoundedCornerShape(Radii.card),
            colors = CardDefaults.cardColors(containerColor = Forest),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(20.dp)) {
                Text("YOUR ARCHETYPE", style = MaterialTheme.typography.labelSmall, color = Amber)
                Spacer(Modifier.height(6.dp))
                Text(r.archetype, style = MaterialTheme.typography.headlineMedium, color = OffWhite)
                Spacer(Modifier.height(6.dp))
                Text(r.archetypeLine, style = MaterialTheme.typography.bodyMedium, color = OffWhite.copy(alpha = 0.85f))
            }
        }
        Spacer(Modifier.height(16.dp))
        batch?.let { b ->
            Card(shape = RoundedCornerShape(Radii.card), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(20.dp)) {
                    Text("RECOMMENDED BATCH", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(6.dp))
                    Text(b.name, style = MaterialTheme.typography.titleMedium)
                    Text("${b.route} · ${b.duration} · ages ${b.ageBand}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(10.dp))
                    Text(r.narrative, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        Spacer(Modifier.height(24.dp))
        PrimaryButton("Reserve my screening slot →", onClick = onApply, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        Text(
            "Applying reserves a screening slot — a human reviews every profile in 24–36h.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(8.dp))
        androidx.compose.material3.TextButton(onClick = onDone) {
            Text(doneLabel, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(24.dp))
    }
}

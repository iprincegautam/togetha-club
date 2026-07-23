package club.togetha.app.feature.apply

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.EngagementTracker
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.components.ScreeningExplainerCard
import club.togetha.app.core.model.Batch
import club.togetha.app.core.model.PaymentPlan
import club.togetha.app.feature.discover.inr
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import kotlinx.coroutines.launch

private enum class Stage { FORM, PAY, RESERVED }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApplyFlowScreen(batchId: String, onBack: () -> Unit, onGoToJourney: () -> Unit) {
    TrackScreen("apply")
    LaunchedEffect(batchId) { EngagementTracker.applyStart(batchId) }

    var batch by remember { mutableStateOf<Batch?>(null) }
    LaunchedEffect(batchId) { batch = Api.client.fetchBatches().firstOrNull { it.id == batchId } }

    var stage by remember { mutableStateOf(Stage.FORM) }
    var step by remember { mutableIntStateOf(0) }

    var name by remember { mutableStateOf("") }
    var age by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var departureId by remember { mutableStateOf("") }
    var plan by remember { mutableStateOf(PaymentPlan.DEPOSIT) }
    var about by remember { mutableStateOf("") }

    var showCheckout by remember { mutableStateOf(false) }
    var paying by remember { mutableStateOf(false) }
    var applicationId by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val b = batch ?: run {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Amber) }
        return
    }
    val payNow = if (plan == PaymentPlan.FULL) b.priceInr else b.depositInr
    val payKind = if (plan == PaymentPlan.FULL) "full" else "deposit"

    when (stage) {
        Stage.FORM -> Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { if (step > 0) step-- else onBack() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                }
                Text("Step ${step + 1} of 3", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.height(12.dp))

            when (step) {
                0 -> {
                    Text("About you", style = MaterialTheme.typography.displayMedium)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "${b.name} · ages ${b.ageBand}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(16.dp))
                    OutlinedTextField(name, { name = it }, label = { Text("Full name") }, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(age, { age = it.filter(Char::isDigit).take(2) }, label = { Text("Age") }, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(12.dp))
                    Text("Gender", style = MaterialTheme.typography.titleSmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Woman", "Man").forEach { g ->
                            FilterChip(selected = gender == g, onClick = { gender = g }, label = { Text(g) })
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(city, { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth())
                    val a = age.toIntOrNull()
                    if (a != null && a !in b.ageMin..b.ageMax) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Heads up: this edition is for ages ${b.ageBand}. The other edition of this trail might be your batch.",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    Spacer(Modifier.height(24.dp))
                    PrimaryButton(
                        "Continue",
                        enabled = name.isNotBlank() && age.isNotBlank() && gender.isNotBlank() && city.isNotBlank(),
                        onClick = { step = 1 },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                1 -> {
                    Text("Departure & plan", style = MaterialTheme.typography.displayMedium)
                    Spacer(Modifier.height(16.dp))
                    Text("Pick your Friday departure", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(8.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        b.departures.forEach { d ->
                            FilterChip(
                                selected = departureId == d.id,
                                onClick = { departureId = d.id },
                                label = { Text("${d.date} · ${d.womenLeft}W/${d.menLeft}M left") },
                            )
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("Payment plan", style = MaterialTheme.typography.titleSmall)
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = plan == PaymentPlan.DEPOSIT,
                            onClick = { plan = PaymentPlan.DEPOSIT },
                            label = { Text("Deposit ${inr(b.depositInr)} (30%)") },
                        )
                        FilterChip(
                            selected = plan == PaymentPlan.FULL,
                            onClick = { plan = PaymentPlan.FULL },
                            label = { Text("Full ${inr(b.priceInr)}") },
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "✦ Pay ${inr(payNow)} now · rest after you're approved",
                        style = MaterialTheme.typography.labelMedium,
                        color = Amber,
                    )
                    Text(
                        "Either way, a human still screens you first — paying in full doesn't skip the queue.",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(
                        about, { about = it },
                        label = { Text("Anything the screening team should know?") },
                        modifier = Modifier.fillMaxWidth().height(120.dp),
                    )
                    Spacer(Modifier.height(24.dp))
                    PrimaryButton(
                        "Review application",
                        enabled = departureId.isNotBlank(),
                        onClick = { step = 2 },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                else -> {
                    Text("Review", style = MaterialTheme.typography.displayMedium)
                    Spacer(Modifier.height(16.dp))
                    Card(shape = RoundedCornerShape(Radii.card)) {
                        Column(Modifier.padding(16.dp)) {
                            ReviewRow("Trip", b.name)
                            ReviewRow("Departure", b.departures.firstOrNull { it.id == departureId }?.date ?: "")
                            ReviewRow("Name", name)
                            ReviewRow("Age", age)
                            ReviewRow("Gender", gender)
                            ReviewRow("City", city)
                            ReviewRow("Plan", if (plan == PaymentPlan.FULL) "Full payment" else "30% deposit")
                            if (about.isNotBlank()) ReviewRow("Note", about)
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    ScreeningExplainerCard()
                    Spacer(Modifier.height(24.dp))
                    PrimaryButton(
                        "Submit & reserve screening slot — ${inr(payNow)}",
                        onClick = {
                            scope.launch {
                                val app = Api.client.submitApplication(
                                    b.id, departureId, plan,
                                    mapOf(
                                        "full_name" to name, "age" to age, "gender" to gender,
                                        "city" to city, "about" to about,
                                    ),
                                )
                                applicationId = app.id
                                stage = Stage.PAY
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }

        Stage.PAY -> Column(Modifier.fillMaxSize().padding(20.dp)) {
            Text("Reserve your screening slot", style = MaterialTheme.typography.displayMedium)
            Spacer(Modifier.height(10.dp))
            Text(
                "This payment holds a slot in the screening queue for ${b.name}. It is not a seat confirmation — a human reviews you first (24–36h).",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))
            Card(shape = RoundedCornerShape(Radii.card)) {
                Column(Modifier.padding(16.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(if (plan == PaymentPlan.FULL) "Full payment" else "Slot-booking deposit (30%)", style = MaterialTheme.typography.bodyLarge)
                        Text(inr(payNow), style = MaterialTheme.typography.titleMedium)
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "✦ Pay ${inr(payNow)} now · rest after you're approved. Fully refunded if the team decides it's not a fit.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Spacer(Modifier.weight(1f))
            PrimaryButton("Pay ${inr(payNow)}", onClick = { showCheckout = true }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(20.dp))

            if (showCheckout) {
                ModalBottomSheet(
                    onDismissRequest = { if (!paying) showCheckout = false },
                    shape = RoundedCornerShape(topStart = Radii.sheet, topEnd = Radii.sheet),
                ) {
                    Column(Modifier.padding(24.dp)) {
                        Text("Checkout", style = MaterialTheme.typography.headlineMedium)
                        Spacer(Modifier.height(4.dp))
                        if (club.togetha.app.BuildConfig.DEBUG) {
                            Text("Mock payment — no real charge.", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(Modifier.height(16.dp))
                        HorizontalDivider()
                        Spacer(Modifier.height(16.dp))
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${b.name} — ${if (plan == PaymentPlan.FULL) "full payment" else "screening deposit"}")
                            Text(inr(payNow), style = MaterialTheme.typography.titleSmall)
                        }
                        Spacer(Modifier.height(24.dp))
                        if (!club.togetha.app.BuildConfig.DEBUG) {
                            // Release: no fake charging. Real Razorpay checkout ships with the live backend.
                            PrimaryButton("Payments open soon", enabled = false, onClick = {}, modifier = Modifier.fillMaxWidth())
                            Spacer(Modifier.height(8.dp))
                            Text(
                                "Payments aren't live in the app yet — you'll be able to reserve your screening slot here soon.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        } else if (paying) {
                            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = Amber)
                            }
                        } else {
                            PrimaryButton("Pay ${inr(payNow)}", onClick = {
                                paying = true
                                scope.launch {
                                    Api.client.createOrder(applicationId.orEmpty(), payKind)
                                    paying = false
                                    showCheckout = false
                                    stage = Stage.RESERVED
                                }
                            }, modifier = Modifier.fillMaxWidth())
                        }
                        Spacer(Modifier.height(32.dp))
                    }
                }
            }
        }

        Stage.RESERVED -> StatusReservedScreen(b.name, onGoToJourney)
    }
}

@Composable
private fun ReviewRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(start = 16.dp))
    }
}

/** Calm confirmation-of-reservation screen. Deliberately no celebration, no "confirmed". */
@Composable
private fun StatusReservedScreen(batchName: String, onGoToJourney: () -> Unit) {
    val transition = rememberInfiniteTransition(label = "pulse")
    val pulse by transition.animateFloat(
        initialValue = 0.5f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1200, easing = LinearEasing), RepeatMode.Reverse),
        label = "pulseAlpha",
    )
    Column(
        Modifier.fillMaxSize().padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            Icons.Filled.HourglassTop,
            contentDescription = null,
            tint = Amber,
            modifier = Modifier.size(44.dp).alpha(pulse),
        )
        Spacer(Modifier.height(24.dp))
        Card(
            shape = RoundedCornerShape(Radii.card),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        ) {
            Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Your screening slot is reserved.", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onSurface)
                Spacer(Modifier.height(12.dp))
                Text(
                    "A human reviews every application — you'll have a decision in 24–36 hours. " +
                        "Nothing is confirmed until then, and that's exactly why the group works. " +
                        "You've also been added to the $batchName Travelers group in Chat.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(8.dp).alpha(pulse)) {
                        Icon(Icons.Filled.HourglassTop, null, tint = Success, modifier = Modifier.size(8.dp))
                    }
                    Spacer(Modifier.size(8.dp))
                    Text("In review", style = MaterialTheme.typography.labelMedium, color = Success)
                }
            }
        }
        Spacer(Modifier.height(28.dp))
        PrimaryButton("Track it on your Journey", onClick = onGoToJourney, modifier = Modifier.fillMaxWidth())
    }
}

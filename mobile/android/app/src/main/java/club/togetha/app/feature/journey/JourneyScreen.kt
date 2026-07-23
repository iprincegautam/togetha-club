package club.togetha.app.feature.journey

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.components.ScreeningExplainerCard
import club.togetha.app.core.model.Application
import club.togetha.app.core.model.ApplicationStatus
import club.togetha.app.core.model.Batch
import club.togetha.app.core.model.KycStatus
import club.togetha.app.feature.discover.inr
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Danger
import club.togetha.app.ui.theme.Success
import kotlinx.coroutines.launch

private data class StepDef(val title: String, val detail: String)

private val steps = listOf(
    StepDef("Applied", "Your application is in — the deposit reserves your screening slot."),
    StepDef("Deposit paid", "Slot reserved. This is not a seat confirmation — screening comes first."),
    StepDef("Profile under review (24–36h)", "A human on the team is reading your application and KYC."),
    StepDef("Approved — pay balance within 48h", "You cleared screening. The 48-hour balance window is running; miss it and the slot is released."),
    StepDef("Confirmed traveler", "Balance paid — you're on the batch. Meet your travel group in Chat."),
)

private fun stepIndex(app: Application): Int = when (app.status) {
    ApplicationStatus.PENDING -> 0
    ApplicationStatus.DEPOSIT_PAID -> 2
    ApplicationStatus.APPROVED -> 3
    ApplicationStatus.PAID -> 4
    ApplicationStatus.REJECTED, ApplicationStatus.EXPIRED -> 2
}

@Composable
fun JourneyScreen() {
    TrackScreen("journey")
    var application by remember { mutableStateOf<Application?>(null) }
    var batch by remember { mutableStateOf<Batch?>(null) }
    var loaded by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    suspend fun refresh() {
        application = Api.client.fetchApplication()
        batch = application?.let { app -> Api.client.fetchBatches().firstOrNull { it.id == app.batchId } }
        loaded = true
    }
    LaunchedEffect(Unit) { refresh() }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)) {
        Text("Your journey", style = MaterialTheme.typography.displayMedium)
        Spacer(Modifier.height(6.dp))
        val app = application
        if (!loaded) {
            Text("Loading…", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else if (app == null) {
            Text(
                "You haven't applied yet. Take the quiz on Discover — it decides your batch, and every application is reviewed by a human.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(20.dp))
            ScreeningExplainerCard()
        } else {
            val b = batch
            when (app.status) {
                ApplicationStatus.REJECTED -> StatusBanner(
                    "This one wasn't a fit — your deposit refund is on its way (5–7 business days).", Danger,
                )
                ApplicationStatus.EXPIRED -> StatusBanner(
                    "Your 48-hour balance window passed, so the slot was released. Your deposit refund is being processed.", Danger,
                )
                ApplicationStatus.APPROVED -> StatusBanner(
                    "Approved! Pay the balance within 48 hours or the slot is released to the queue.", Amber,
                )
                else -> Text(
                    buildString {
                        append("Applied ${app.appliedAt}")
                        b?.let { append(" · ${it.name}") }
                        if (app.departureId.isNotBlank()) append(" · departure reserved")
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(Modifier.height(12.dp))
            KycChip(app.kycStatus)
            Spacer(Modifier.height(20.dp))

            val current = stepIndex(app)
            val failed = app.status == ApplicationStatus.REJECTED || app.status == ApplicationStatus.EXPIRED
            steps.forEachIndexed { i, step ->
                TimelineRow(
                    step = step,
                    state = when {
                        failed && i >= current -> RowState.BLOCKED
                        i < current -> RowState.DONE
                        i == current -> RowState.CURRENT
                        else -> RowState.UPCOMING
                    },
                    last = i == steps.lastIndex,
                )
            }

            if (app.status == ApplicationStatus.APPROVED && b != null) {
                Spacer(Modifier.height(16.dp))
                Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Amber.copy(alpha = 0.14f))) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Balance due: ${inr(b.priceInr - b.depositInr)}", style = MaterialTheme.typography.titleMedium)
                        Text(
                            "Window: ${app.balanceDeadline ?: "48 hours from approval"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))
                PrimaryButton(
                    "Pay my balance — lock my seat",
                    onClick = { scope.launch { Api.client.createOrder(app.id, "balance"); refresh() } },
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            if (club.togetha.app.BuildConfig.DEBUG && app.status == ApplicationStatus.DEPOSIT_PAID) {
                Spacer(Modifier.height(8.dp))
                TextButton(onClick = { scope.launch { Api.mock.simulateApproval(); refresh() } }) {
                    Text("Demo: simulate the team's approval", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
        Spacer(Modifier.height(80.dp))
    }
}

@Composable
private fun StatusBanner(text: String, tint: androidx.compose.ui.graphics.Color) {
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = tint.copy(alpha = 0.14f))) {
        Text(text, modifier = Modifier.padding(16.dp), style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun KycChip(status: KycStatus) {
    val (label, color) = when (status) {
        KycStatus.PENDING -> "KYC: not started — complete it from Account" to MaterialTheme.colorScheme.onSurfaceVariant
        KycStatus.SUBMITTED -> "KYC: submitted, with the screening team" to Amber
        KycStatus.APPROVED -> "KYC: approved" to Success
    }
    Surface(shape = RoundedCornerShape(999.dp), color = color.copy(alpha = 0.14f)) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
            style = MaterialTheme.typography.labelMedium,
            color = color,
        )
    }
}

private enum class RowState { DONE, CURRENT, UPCOMING, BLOCKED }

@Composable
private fun TimelineRow(step: StepDef, state: RowState, last: Boolean) {
    Row {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier
                    .size(16.dp)
                    .clip(CircleShape)
                    .background(
                        when (state) {
                            RowState.DONE -> Success
                            RowState.CURRENT -> Amber
                            RowState.BLOCKED -> Danger.copy(alpha = 0.5f)
                            RowState.UPCOMING -> MaterialTheme.colorScheme.surfaceVariant
                        }
                    )
            )
            if (!last) {
                Box(
                    Modifier
                        .width(2.dp)
                        .height(56.dp)
                        .background(
                            if (state == RowState.DONE) Success.copy(alpha = 0.5f)
                            else MaterialTheme.colorScheme.surfaceVariant
                        )
                )
            }
        }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.padding(bottom = 16.dp)) {
            Text(
                step.title,
                style = MaterialTheme.typography.titleMedium,
                color = if (state == RowState.UPCOMING || state == RowState.BLOCKED)
                    MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
            )
            Text(step.detail, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

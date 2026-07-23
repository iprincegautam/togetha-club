package club.togetha.app.feature.discover

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.EngagementTracker
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.GenderBalanceBar
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.components.VerifiedBadge
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import club.togetha.app.core.model.Batch
import club.togetha.app.core.state.AppState
import club.togetha.app.feature.site.BatchContent
import club.togetha.app.feature.site.SiteChip
import club.togetha.app.feature.site.SiteImages
import club.togetha.app.feature.site.accent
import club.togetha.app.nav.Routes
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Ink
import club.togetha.app.ui.theme.OffWhite
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import java.text.NumberFormat
import java.util.Locale
import kotlinx.coroutines.launch

fun inr(amount: Int): String =
    "₹" + NumberFormat.getNumberInstance(Locale("en", "IN")).format(amount)

@Composable
fun DiscoverScreen(
    onBatchClick: (String) -> Unit,
    onTakeQuiz: () -> Unit,
    onExplore: (String) -> Unit = {},
) {
    TrackScreen("discover")
    var batches by remember { mutableStateOf<List<Batch>?>(null) }
    LaunchedEffect(Unit) {
        batches = Api.client.fetchBatches()
        batches?.forEach { EngagementTracker.listingView(it.id) }
    }

    // Uniform horizontal margin lives on each item so the chip strip can bleed
    // edge-to-edge without trailing clipping. Top inset comes from the Scaffold.
    val hPad = Modifier.padding(horizontal = 20.dp)
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        item {
            Column(hPad) {
                Text("Where singles travel", style = MaterialTheme.typography.displayMedium, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text("togetha.", style = MaterialTheme.typography.displayMedium, color = Amber, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(6.dp))
                Text(
                    "12 women, 12 men per departure. Every batch human-screened, every Friday.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(14.dp))
                Card(
                    shape = RoundedCornerShape(Radii.card),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                    modifier = Modifier.fillMaxWidth().clickable(onClick = onTakeQuiz),
                ) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            if (AppState.quizCompleted) {
                                Text("Your fit: ${AppState.quizScore ?: 0}% · ${AppState.quizArchetype}", style = MaterialTheme.typography.titleSmall)
                                Text(
                                    "Edit your answers anytime — your batch updates with them.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            } else {
                                Text("Not sure which batch is yours?", style = MaterialTheme.typography.titleSmall)
                                Text(
                                    "Take the 13-question quiz — our AI reads your fit.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        Text("Check my fit →", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSecondaryContainer)
                    }
                }
            }
        }
        val list = batches
        if (list == null) {
            item {
                Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Amber)
                }
            }
        } else {
            // Age-band edition filtering — the Mystery (waitlist) card is always visible.
            val editionIds = AppState.editionBatchIds
            val visible = list.filter { it.waitlistOnly || editionIds == null || it.id in editionIds }
            if (editionIds == null) {
                item {
                    Text(
                        "✦ Best fit shown after your quiz",
                        modifier = hPad,
                        style = MaterialTheme.typography.labelMedium,
                        color = Amber,
                    )
                }
            }
            items(visible.size) { i ->
                val batch = visible[i]
                Box(hPad) {
                    if (batch.waitlistOnly) {
                        MysteryWaitlistCard(batch)
                    } else {
                        BatchCard(batch, onClick = {
                            EngagementTracker.listingClick(batch.id)
                            onBatchClick(batch.id)
                        })
                    }
                }
            }
            item { ExploreClubStrip(onExplore) }
            item { Box(hPad) { SafetyStripCard(onOpenSafety = { onExplore(Routes.SAFETY) }) } }
        }
    }
}

@Composable
private fun ExploreClubStrip(onExplore: (String) -> Unit) {
    Column {
        Text(
            "Explore the club",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(horizontal = 20.dp),
        )
        Spacer(Modifier.height(10.dp))
        // Full-bleed scroll with inner padding so trailing chips never clip at the margin.
        Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(start = 20.dp, end = 10.dp)) {
            listOf(
                "How it works" to Routes.HOW_IT_WORKS,
                "Safety" to Routes.SAFETY,
                "Itineraries" to Routes.itineraries(),
                "Journal" to Routes.JOURNAL,
                "About" to Routes.ABOUT,
            ).forEach { (label, route) ->
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    modifier = Modifier.padding(end = 10.dp).clickable { onExplore(route) },
                ) {
                    Text(
                        label,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                        style = MaterialTheme.typography.labelLarge,
                    )
                }
            }
        }
    }
}

@Composable
private fun SafetyStripCard(onOpenSafety: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onOpenSafety),
        shape = RoundedCornerShape(Radii.card),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(Modifier.padding(18.dp)) {
            Text(
                accent("Every person in your batch is verified by a **real human — by hand.**"),
                style = MaterialTheme.typography.headlineSmall,
            )
            Spacer(Modifier.height(12.dp))
            @OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(
                    "Government ID, checked by hand",
                    "LinkedIn + socials cross-referenced",
                    "Single-gender rooms",
                    "Female trip leads",
                    "Captains with you 24/7",
                ).forEach { SiteChip(it) }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Can't verify you? Full refund.", style = MaterialTheme.typography.labelLarge, color = Amber)
                Text("See who gets in →", style = MaterialTheme.typography.labelLarge, color = Amber)
            }
        }
    }
}

@Composable
private fun BatchCard(batch: Batch, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(Radii.card),
    ) {
        Column {
            val cover = SiteImages.coverFor(batch.id)
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .background(
                        Brush.linearGradient(
                            listOf(Color(batch.coverColor), Color(batch.coverColor).copy(alpha = 0.75f))
                        )
                    )
            ) {
                if (cover != null) {
                    Image(
                        painterResource(cover.res),
                        contentDescription = cover.caption,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                    )
                }
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, Color.Black.copy(alpha = 0.65f)),
                            )
                        )
                )
                Column(Modifier.align(Alignment.BottomStart).padding(16.dp)) {
                    Text(batch.name, style = MaterialTheme.typography.headlineSmall, color = OffWhite)
                    Text(
                        "${batch.route} · ${batch.duration} · ages ${batch.ageBand}",
                        style = MaterialTheme.typography.bodySmall,
                        color = OffWhite.copy(alpha = 0.85f),
                    )
                }
                Surface(
                    modifier = Modifier.align(Alignment.TopEnd).padding(12.dp),
                    shape = RoundedCornerShape(999.dp),
                    color = Amber,
                ) {
                    Text(
                        batch.departures.firstOrNull()?.date ?: "Fridays",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Ink,
                    )
                }
            }
            Column(Modifier.padding(16.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(inr(batch.priceInr), style = MaterialTheme.typography.titleMedium)
                        Text(
                            "✦ Pay ${inr(batch.depositInr)} now · rest after you're approved",
                            style = MaterialTheme.typography.labelSmall,
                            color = Amber,
                        )
                    }
                    VerifiedBadge("Screened group")
                }
                // Real scarcity only — straight from the batch capacity numbers.
                val womenLeft = batch.womenCapacity - batch.womenCount
                val menLeft = batch.menCapacity - batch.menCount
                if (womenLeft in 1..4 || menLeft in 1..4) {
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (womenLeft in 1..4) ScarcityChip("Only $womenLeft spots left for women")
                        if (menLeft in 1..4) ScarcityChip("Only $menLeft spots left for men")
                    }
                }
                Spacer(Modifier.height(14.dp))
                GenderBalanceBar(batch.womenCount, batch.menCount)
                Spacer(Modifier.height(12.dp))
                Text(
                    "See my dates →",
                    style = MaterialTheme.typography.labelLarge,
                    color = Amber,
                    modifier = Modifier.align(Alignment.End),
                )
            }
        }
    }
}

@Composable
private fun ScarcityChip(text: String) {
    Surface(shape = RoundedCornerShape(999.dp), color = Amber.copy(alpha = 0.16f)) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = Amber,
        )
    }
}

@Composable
private fun MysteryWaitlistCard(batch: Batch) {
    var email by remember { mutableStateOf("") }
    var joined by remember { mutableStateOf(false) }
    var joining by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(Radii.card),
        colors = CardDefaults.cardColors(containerColor = Color(batch.coverColor)),
    ) {
        Column(Modifier.padding(20.dp)) {
            Text(BatchContent.mysteryEyebrow, style = MaterialTheme.typography.labelSmall, color = Amber)
            Spacer(Modifier.height(6.dp))
            Text(BatchContent.mysteryTitle, style = MaterialTheme.typography.headlineSmall, color = OffWhite)
            Spacer(Modifier.height(4.dp))
            Text(batch.tagline, style = MaterialTheme.typography.bodyMedium, color = OffWhite.copy(alpha = 0.85f))
            Spacer(Modifier.height(10.dp))
            Text(
                BatchContent.mysteryDates,
                style = MaterialTheme.typography.bodySmall,
                color = OffWhite.copy(alpha = 0.8f),
            )
            Spacer(Modifier.height(6.dp))
            Text(
                BatchContent.mysteryPrice,
                style = MaterialTheme.typography.bodySmall,
                color = OffWhite.copy(alpha = 0.8f),
            )
            Spacer(Modifier.height(12.dp))
            BatchContent.mysteryClues.forEach { clue ->
                Surface(
                    shape = RoundedCornerShape(Radii.button),
                    color = Color.Black.copy(alpha = 0.25f),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                ) {
                    Column(Modifier.padding(12.dp)) {
                        Text(clue.title, style = MaterialTheme.typography.titleSmall, color = OffWhite)
                        if (clue.body != null) {
                            Spacer(Modifier.height(3.dp))
                            Text(clue.body, style = MaterialTheme.typography.bodySmall, color = OffWhite.copy(alpha = 0.75f))
                        }
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(BatchContent.mysteryStamp, style = MaterialTheme.typography.labelMedium, color = Amber)
            Spacer(Modifier.height(12.dp))
            if (joined) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.CheckCircle, null, tint = Success, modifier = Modifier.size(20.dp))
                    Spacer(Modifier.size(8.dp))
                    Text(
                        "You're on the list — we'll write when the mystery opens.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = OffWhite,
                    )
                }
            } else {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("your@email.com", color = OffWhite.copy(alpha = 0.5f)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(Radii.button),
                )
                Spacer(Modifier.height(12.dp))
                PrimaryButton(
                    if (joining) "Joining…" else "Join the waitlist",
                    enabled = !joining && email.contains("@") && email.contains("."),
                    onClick = {
                        joining = true
                        scope.launch {
                            Api.client.joinWaitlist(batch.id, email.trim())
                            joining = false
                            joined = true
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

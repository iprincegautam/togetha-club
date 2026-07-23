package club.togetha.app.feature.batchdetail

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Female
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.GenderBalanceBar
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.components.ScreeningExplainerCard
import club.togetha.app.core.components.VerifiedBadge
import club.togetha.app.core.model.Batch
import club.togetha.app.feature.discover.inr
import club.togetha.app.feature.site.BatchContent
import club.togetha.app.feature.site.ExpandableRow
import club.togetha.app.feature.site.GalleryPager
import club.togetha.app.feature.site.PosterStrip
import club.togetha.app.feature.site.SiteImages
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.OffWhite
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import club.togetha.app.ui.theme.WomenAccent

@Composable
fun BatchDetailScreen(
    batchId: String,
    onBack: () -> Unit,
    onApply: () -> Unit,
    onItinerary: (String) -> Unit = {},
) {
    club.togetha.app.core.analytics.TrackScreen("batch_detail_$batchId")
    var batch by remember { mutableStateOf<Batch?>(null) }
    LaunchedEffect(batchId) {
        batch = Api.client.fetchBatches().firstOrNull { it.id == batchId }
    }
    val b = batch ?: run {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Amber)
        }
        return
    }

    Box(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize()) {
            item {
                val cover = SiteImages.coverFor(b.id)
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(b.coverColor), Color(b.coverColor).copy(alpha = 0.65f))
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
                        Box(
                            Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        listOf(Color.Black.copy(alpha = 0.25f), Color.Black.copy(alpha = 0.7f))
                                    )
                                )
                        )
                    }
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.statusBarsPadding().padding(8.dp),
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = OffWhite)
                    }
                    Column(Modifier.align(Alignment.BottomStart).padding(20.dp)) {
                        VerifiedBadge("Human-screened batch")
                        Spacer(Modifier.height(10.dp))
                        Text(b.name, style = MaterialTheme.typography.displayMedium, color = OffWhite)
                        Text(b.tagline, style = MaterialTheme.typography.bodyLarge, color = OffWhite.copy(alpha = 0.85f))
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "${b.route} · ${b.duration} · ages ${b.ageBand}",
                            style = MaterialTheme.typography.bodySmall,
                            color = OffWhite.copy(alpha = 0.8f),
                        )
                    }
                }
            }
            item {
                Column(Modifier.padding(20.dp)) {
                    GenderBalanceBar(b.womenCount, b.menCount)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Capped at ${b.womenCapacity} women / ${b.menCapacity} men per departure · ${b.spotsLeft} spots left",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(24.dp))

                    Text("Friday departures", style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(12.dp))
                    b.departures.forEach { d ->
                        Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(d.date, style = MaterialTheme.typography.bodyMedium)
                            Text(
                                "${d.womenLeft}W / ${d.menLeft}M left",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Spacer(Modifier.height(24.dp))

                    Text("What this trip costs", style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(12.dp))
                    Card(shape = RoundedCornerShape(Radii.card)) {
                        Column(Modifier.padding(16.dp)) {
                            PriceRow("Trip price", inr(b.priceInr))
                            Spacer(Modifier.height(8.dp))
                            PriceRow("✦ Pay ${inr(b.depositInr)} now · rest after you're approved", inr(b.depositInr), highlight = true)
                            Spacer(Modifier.height(8.dp))
                            PriceRow("Balance — only after you're approved", inr(b.priceInr - b.depositInr))
                            Spacer(Modifier.height(12.dp))
                            HorizontalDivider()
                            Spacer(Modifier.height(12.dp))
                            Text(
                                "The deposit doesn't confirm a seat. A human reviews your application first — " +
                                    "if it's not a fit, the deposit is fully refunded.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }

                    Spacer(Modifier.height(24.dp))
                    Text("Why it feels safe", style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(12.dp))
                    TrustRow(Icons.Filled.Visibility, "Every traveller is identity-verified before day one.")
                    TrustRow(Icons.Filled.Shield, "A human screens every application — no auto-approvals.")
                    TrustRow(Icons.Filled.Female, "Balanced by design: capped at ${b.womenCapacity} women and ${b.menCapacity} men per departure.", tint = WomenAccent)

                    Spacer(Modifier.height(24.dp))
                    Text("The days", style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(12.dp))
                    b.itinerary.forEach { day ->
                        Row(Modifier.padding(vertical = 8.dp)) {
                            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer) {
                                Text(
                                    "${day.day}",
                                    modifier = Modifier.padding(horizontal = 11.dp, vertical = 5.dp),
                                    style = MaterialTheme.typography.labelLarge,
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(day.title, style = MaterialTheme.typography.titleSmall)
                                Text(day.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }

                    Spacer(Modifier.height(24.dp))
                    Text("Highlights", style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    b.highlights.forEach {
                        Text("•  $it", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(vertical = 3.dp))
                    }

                    Spacer(Modifier.height(24.dp))
                    val trip = if (b.id == "batch-d" || b.id == "batch-e") "udaipur" else "himalayan"
                    val gallery = SiteImages.galleryFor(b.id)
                    if (gallery.isNotEmpty()) {
                        Text("The place, for real", style = MaterialTheme.typography.headlineMedium)
                        Spacer(Modifier.height(12.dp))
                        GalleryPager(gallery)
                        Spacer(Modifier.height(16.dp))
                    }
                    if (!b.waitlistOnly) {
                        Card(
                            modifier = Modifier.fillMaxWidth().clickable { onItinerary(trip) },
                            shape = RoundedCornerShape(Radii.card),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                        ) {
                            Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Full day-by-day itinerary", style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                                Text("→", style = MaterialTheme.typography.titleSmall, color = Amber)
                            }
                        }
                        Spacer(Modifier.height(24.dp))
                    }

                    val vibe = BatchContent.vibeFor(b.id)
                    if (vibe != null) {
                        ExpandableRow(title = vibe.label, subtitle = vibe.heading, initiallyExpanded = true) {
                            Column {
                                vibe.intro.forEach {
                                    Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(bottom = 8.dp))
                                }
                                vibe.cards.forEach { card ->
                                    Column(Modifier.padding(vertical = 6.dp)) {
                                        Text(card.title, style = MaterialTheme.typography.titleSmall, color = Amber)
                                        if (card.body != null) {
                                            Text(card.body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }
                                }
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                    }

                    if (trip == "himalayan" && !b.waitlistOnly) {
                        ExpandableRow(title = "Reviews", subtitle = "From the pilot batches") {
                            Column {
                                BatchContent.himalayanReviews.forEach { review ->
                                    Column(Modifier.padding(vertical = 8.dp)) {
                                        Text("“${review.quote}”", style = MaterialTheme.typography.bodySmall)
                                        Spacer(Modifier.height(4.dp))
                                        Text("— ${review.who}", style = MaterialTheme.typography.labelMedium, color = Amber)
                                    }
                                }
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                    }

                    if (!b.waitlistOnly) {
                        PosterStrip()
                        Spacer(Modifier.height(20.dp))
                    }

                    val includes = BatchContent.includesFor(b.id)
                    if (includes != null) {
                        ExpandableRow(title = includes.label, subtitle = includes.heading) {
                            Column {
                                includes.items.forEach {
                                    Text("✓  $it", style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(vertical = 3.dp))
                                }
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                    }

                    if (!b.waitlistOnly) {
                        ExpandableRow(title = "The fine print", subtitle = BatchContent.policiesHeading) {
                            Column {
                                BatchContent.policies.forEach {
                                    Text("•  $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(vertical = 3.dp))
                                }
                            }
                        }
                        Spacer(Modifier.height(24.dp))
                    }

                    ScreeningExplainerCard()
                    Spacer(Modifier.height(110.dp))
                }
            }
        }

        Column(
            Modifier
                .align(Alignment.BottomCenter)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, MaterialTheme.colorScheme.background)
                    )
                )
                .padding(20.dp)
        ) {
            PrimaryButton(
                text = "Reserve my screening slot — ${inr(b.depositInr)}",
                onClick = onApply,
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(6.dp))
            Text(
                "✦ ${inr(b.depositInr)} now · rest after you're approved",
                style = MaterialTheme.typography.labelSmall,
                color = Amber,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
        }
    }
}

@Composable
private fun PriceRow(label: String, value: String, highlight: Boolean = false) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            color = if (highlight) Amber else MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
        )
        Text(value, style = MaterialTheme.typography.titleSmall)
    }
}

@Composable
private fun TrustRow(icon: ImageVector, text: String, tint: Color = Success) {
    Row(Modifier.padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(12.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium)
    }
}

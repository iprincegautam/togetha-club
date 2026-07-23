package club.togetha.app.feature.site

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Radii

private data class JournalPost(val title: String, val excerpt: String, val tag: String)

private val posts = listOf(
    JournalPost(
        "Why Swiping Stopped Working: What Indian Singles Are Choosing Instead in 2026",
        "Dating apps aren't dead — but millions of Indian singles are exhausted by them. Here's what they're trying next, and why shared experiences beat another coffee date.",
        "Dating app fatigue",
    ),
    JournalPost(
        "Not a Group Tour. Not Matrimony. What a Matchmaking Travel Club Actually Is",
        "Confused about what a matchmaking travel club is? Here's the honest anatomy — screening, AI matching, designed events, and destinations from Himachal to festivals.",
        "What it actually is",
    ),
    JournalPost(
        "What Actually Happens on a Togetha Experience: Connection, Safety, and Real Pricing",
        "Nervous about joining 23 strangers? Here's exactly how designed connection works, how we keep batches safe, and what you'll pay — pulled from live pricing.",
        "Honest answers",
    ),
)

@Composable
fun JournalScreen(onBack: () -> Unit) {
    TrackScreen("journal")
    var selected by remember { mutableStateOf<JournalPost?>(null) }
    val reading = selected

    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { if (reading != null) selected = null else onBack() }) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
            }
            Text("Journal", style = MaterialTheme.typography.titleMedium)
        }
        if (reading != null) {
            Column(
                Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)
            ) {
                Text(reading.tag.uppercase(), style = MaterialTheme.typography.labelSmall, color = Amber)
                Spacer(Modifier.height(8.dp))
                Text(reading.title, style = MaterialTheme.typography.displayMedium)
                Spacer(Modifier.height(14.dp))
                Text(reading.excerpt, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(20.dp))
                Text("Read the full story on togetha.club", style = MaterialTheme.typography.labelLarge, color = Amber)
            }
        } else {
            LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = PaddingValues(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                item {
                    Reveal {
                        Column {
                            Text("✦ Togetha Journal", style = MaterialTheme.typography.labelSmall, color = Amber)
                            Spacer(Modifier.height(8.dp))
                            Text("Stories for singles who'd rather show up", style = MaterialTheme.typography.displayMedium, maxLines = 3, overflow = TextOverflow.Ellipsis)
                            Spacer(Modifier.height(10.dp))
                            Text(
                                "Dating app fatigue, what a matchmaking travel club actually is, and honest answers before you apply — SEO-enriched guides from India's first experience-driven singles club.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
                items(posts.size) { i ->
                    val post = posts[i]
                    Card(
                        Modifier.fillMaxWidth().clickable { selected = post },
                        shape = RoundedCornerShape(Radii.card),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    ) {
                        Column(Modifier.padding(18.dp)) {
                            Text(post.tag.uppercase(), style = MaterialTheme.typography.labelSmall, color = Amber)
                            Spacer(Modifier.height(6.dp))
                            Text(post.title, style = MaterialTheme.typography.headlineSmall)
                            Spacer(Modifier.height(8.dp))
                            Text(post.excerpt, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(Modifier.height(10.dp))
                            Text("Read →", style = MaterialTheme.typography.labelLarge, color = Amber)
                        }
                    }
                }
            }
        }
    }
}

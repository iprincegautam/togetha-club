package club.togetha.app.feature.site

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.ui.theme.Amber

@Composable
fun AboutScreen(onBack: () -> Unit) {
    TrackScreen("about")
    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("About", style = MaterialTheme.typography.titleMedium)
        }
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)) {
            Reveal {
                Column {
                    Text("ABOUT US", style = MaterialTheme.typography.labelSmall, color = Amber)
                    Spacer(Modifier.height(8.dp))
                    Text("Togetha.Club", style = MaterialTheme.typography.displayMedium)
                    Text(
                        "India's first matchmaking travel club",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Amber,
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Togetha.Club is not a travel package company. We are an experience-driven matchmaking travel club for verified singles who want real connection — not another swipe session. The people are the product; the Himalayan batch is the context where chemistry actually has room to happen.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(20.dp))
                    Text("What we do", style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Every month we run curated batches — GenZ (18–25) and Millennial (26–36) editions — with balanced cohorts, AI compatibility matching, and 5 nights across Manali, Sissu, and Kasol. Take the quiz, book your slot, pay online, and show up.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(20.dp))
                    Text("Where we're headed", style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Himachal is live today. Uttarakhand, J&K, Rajasthan, the Northeast, and festival-led lifestyle editions are on the roadmap — always with the same promise: verified singles, intentional matching, and trips built for connection.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(28.dp))
                    HorizontalDivider()
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "India's first matchmaking travel club. Like Hinge, but for travelers.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "© 2026 Togetha.Club · Made with ♡ for people who believe in the real thing",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(40.dp))
                }
            }
        }
    }
}

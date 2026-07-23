package club.togetha.app.feature.site

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
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
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Danger
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success

private val safetyFaq = listOf(
    "Who actually does the checking?" to "A real person on our team — not an algorithm, not a bot. Every applicant, by hand.",
    "What if I don't get in?" to "We'll tell you, and we'll refund you in full. The gate is real — that's what makes the room safe.",
    "Do men and women room together?" to "Never. Single-gender rooms, every trip, no exceptions.",
    "What if I don't click with anyone?" to "Then you go home with 23 new friends. Zero pressure to pair up — that was never the deal.",
    "Is my ID safe with you?" to "Used only to verify you, never shared or made public, and never part of a profile.",
    "Who's with us on the trip?" to "A female trip lead and captains, on the ground and reachable 24/7.",
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SafetyScreen(onBack: () -> Unit) {
    TrackScreen("safety")
    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("Safety", style = MaterialTheme.typography.titleMedium)
        }
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(28.dp),
        ) {
            // Hero
            item {
                Reveal {
                    Column {
                        Text("✦ Verified Humans Only ✦", style = MaterialTheme.typography.labelSmall, color = Amber)
                        Spacer(Modifier.height(8.dp))
                        Text(accent("Not everyone gets in. **That's the point.**"), style = MaterialTheme.typography.displayMedium, maxLines = 3, overflow = TextOverflow.Ellipsis)
                        Spacer(Modifier.height(10.dp))
                        Text(
                            "You're about to travel with people you haven't met. That only works if the room is safe first. So we built the whole thing backwards from that one rule — and we check every single person by hand before they're ever confirmed.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(16.dp))
                        CaptionedPhoto(SiteImages.himalayan[4])
                    }
                }
            }
            // 1 The gate
            item {
                Column {
                    Text(
                        accent("\"Verified\" usually means a bot glanced at a selfie. Here, a **real person** opens your file."),
                        style = MaterialTheme.typography.headlineMedium,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Before anyone joins a batch, we cross-check — by hand:",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))
                    listOf(
                        "Government ID" to "Confirmed, real, and current.",
                        "LinkedIn & work" to "The job and the history line up.",
                        "Socials" to "The person online is the person on the ID.",
                    ).forEach { (title, body) ->
                        Card(
                            Modifier.fillMaxWidth().padding(vertical = 5.dp),
                            shape = RoundedCornerShape(Radii.card),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        ) {
                            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text("✓", style = MaterialTheme.typography.titleMedium, color = Success)
                                Spacer(Modifier.width(12.dp))
                                Column {
                                    Text(title, style = MaterialTheme.typography.titleSmall, color = Amber)
                                    Text(body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "One human reads all of it together and confirms it's the same person. If the story doesn't line up, they don't get in — no matter how full the batch is, no matter the revenue. The room has to be safe first. Everything else is second.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            // 2 Guarantee
            item {
                Card(shape = RoundedCornerShape(Radii.card)) {
                    Column(Modifier.padding(18.dp)) {
                        Stamp("Safe by design ♡")
                        Spacer(Modifier.height(10.dp))
                        Text("Can't verify you? Full refund.", style = MaterialTheme.typography.headlineMedium, color = Amber)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "We'd rather lose a booking than put a question mark in the room. If we can't confirm you're exactly who you say you are, you don't join — and you get every rupee back. No arguing, no exceptions.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            // 3 On the ground
            item {
                Column {
                    Text(accent("Verified is where safety **starts** — not where it ends."), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(12.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        listOf(
                            "12 women + 12 men" to "A balanced room, every batch.",
                            "Single-gender rooms" to "Always. Never a question you have to ask.",
                            "Female trip leads" to "Someone who gets it, with you the whole way.",
                            "Captains 24/7" to "On the ground, reachable, all trip long.",
                        ).forEach { (title, body) ->
                            Card(
                                Modifier.fillMaxWidth(0.47f),
                                shape = RoundedCornerShape(Radii.card),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            ) {
                                Column(Modifier.padding(14.dp)) {
                                    Text(title, style = MaterialTheme.typography.titleSmall, color = Amber)
                                    Spacer(Modifier.height(4.dp))
                                    Text(body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    CaptionedPhoto(SiteImages.udaipur[5], height = 200.dp)
                }
            }
            // 4 No pressure
            item {
                Column {
                    Text(accent("No one is here to **force a match.**"), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "This isn't a show and there's no reveal. If there's a spark, it'll be real and it'll be yours. If there isn't, you still go home with 23 people you actually know — still texting, still in your phone months later. That's the worst case. It's a good one.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            // 5 Structure is safety
            item {
                Column {
                    Text(accent("Everything's planned — so you never coordinate **alone with a stranger.**"), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Travel, stays, most meals, the full itinerary, ice-breakers, bonfire nights — all handled by us. You never have to negotiate where, when, or how with someone you just met. You show up as yourself; the rest is already taken care of.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            // 6 Your data
            item {
                Column {
                    Text(accent("We check your story to keep the room safe. **Then we stop.**"), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Your ID and documents are used for one thing: confirming you're a real, verified person before you join a batch. That's it. We don't sell it, we don't post it, and it never becomes part of a public profile.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            // 7 Who's with you
            item {
                Column {
                    Text(accent("You won't be handed to a stranger. **You'll be led by her.**"), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Every batch travels with a female trip lead — on the ground, reachable, the whole way. Not a chaperone. The person you go to if anything feels off, at any hour.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(12.dp))
                    listOf(
                        Triple("Anchal Gupta", "Trip Lead", "My rule is simple: everyone in my batch gets home feeling safer than they arrived."),
                        Triple("Prince Gautam", "Founder & Trip Lead", "If anything feels off, you come to me — any hour, no question too small."),
                    ).forEach { (name, role, quote) ->
                        Card(
                            Modifier.fillMaxWidth().padding(vertical = 5.dp),
                            shape = RoundedCornerShape(Radii.card),
                        ) {
                            Row(Modifier.padding(16.dp)) {
                                Surface(shape = CircleShape, color = Amber) {
                                    Text(
                                        name.split(" ").mapNotNull { it.firstOrNull() }.joinToString(""),
                                        modifier = Modifier.padding(14.dp),
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.background,
                                    )
                                }
                                Spacer(Modifier.width(14.dp))
                                Column {
                                    Text(name, style = MaterialTheme.typography.headlineSmall)
                                    Text(role, style = MaterialTheme.typography.labelMedium, color = Amber)
                                    Spacer(Modifier.height(6.dp))
                                    Text("“$quote”", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Spacer(Modifier.height(6.dp))
                                    Text("✦ Led several batches · with you 24/7", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
            // 8 Case file
            item {
                Column {
                    Text(accent("\"Verified\" is a word. **This is the receipt.**"), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(12.dp))
                    Card(
                        shape = RoundedCornerShape(6.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Amber.copy(alpha = 0.5f)),
                    ) {
                        Column(Modifier.padding(18.dp)) {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("APPLICANT FILE · #REDACTED", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("✦ Reviewed by hand", style = MaterialTheme.typography.labelSmall, color = Amber)
                            }
                            Spacer(Modifier.height(12.dp))
                            HorizontalDivider()
                            listOf(
                                "Government ID" to "✓ real & current",
                                "LinkedIn & work" to "✓ history lines up",
                                "Instagram / socials" to "✓ same person",
                                "Cross-check" to "ID ↔ LinkedIn ↔ socials",
                            ).forEach { (k, v) ->
                                Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(k, style = MaterialTheme.typography.bodySmall)
                                    Text(v, style = MaterialTheme.typography.bodySmall, color = Success)
                                }
                                HorizontalDivider()
                            }
                            Spacer(Modifier.height(12.dp))
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column {
                                    Text("Verdict", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text("SAME HUMAN — CONFIRMED", style = MaterialTheme.typography.titleSmall, color = Success)
                                }
                                Stamp("Verified · by hand", color = Success)
                            }
                            Spacer(Modifier.height(12.dp))
                            Text(
                                "Real files, redacted for privacy. We never publish anyone's documents.",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
            // 9 The gate is real
            item {
                Card(
                    shape = RoundedCornerShape(Radii.card),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                ) {
                    Column(Modifier.padding(18.dp)) {
                        Stamp("Declined", color = Danger)
                        Spacer(Modifier.height(10.dp))
                        Text(accent("**80%** of applications don't make it in"), style = MaterialTheme.typography.headlineMedium)
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "A safe room isn't the one that lets everyone in — it's the one that turns people away. If we can't confirm someone is exactly who they say they are, they don't travel with you. We'd rather lose the booking.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            // 10 Founder note
            item {
                Column {
                    Text(accent("I check the hard ones **myself.**"), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Most apps say \"verified\" and mean a bot glanced at a selfie. I didn't want that on my conscience — not for the women who trust us enough to show up.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "So the checks are done by real people, and the ones that don't sit right, I look at myself. If the story doesn't line up, they don't get in — no matter how full the batch is, no matter the revenue.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "The women in that room trusted us first. Everything we do starts there.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(10.dp))
                    Text("— Prince Gautam", style = MaterialTheme.typography.headlineSmall, color = Amber)
                    Text("✦ Founder, Togetha", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            // 11 FAQ + close
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("FAQ", style = MaterialTheme.typography.headlineMedium)
                    safetyFaq.forEach { (q, a) -> FaqItem(q, a) }
                }
            }
            item {
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Stamp("Welcome to the club")
                    Spacer(Modifier.height(12.dp))
                    Text(
                        "The women in that room trusted us first. So do the checks.",
                        style = MaterialTheme.typography.headlineMedium,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(40.dp))
                }
            }
        }
    }
}

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
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Radii

private data class Step(val num: String, val title: String, val body: String)

private val steps = listOf(
    Step("01", "Take the quiz", "12 questions — age first, then personality. Our AI builds your compatibility profile and shows your best batch fit."),
    Step("02", "Book your slot", "Pick your Friday departure, pay on the website, and lock your spot. 12 women and 12 men — gender balance guaranteed."),
    Step("03", "AI matches your batch", "The algorithm places you where your compatibility score is highest. You meet your group on Day 1 — that's intentional."),
    Step("04", "Go to the mountains", "Manali → Sissu → Kasol. 5 nights, 6 days. Ice breakers, bonfires, real conversations. What happens next is entirely yours."),
)

private val ideaStats = listOf(
    Triple("24", "Verified singles per batch", "12 women · 12 men · always balanced."),
    Triple("2", "Batches every month", "GenZ edition & Millennial edition."),
    Triple("6", "Days in the Himalayas", "Manali · Kasol · Sissu."),
    Triple("60%", "Report something meaningful changed", "Romance, deep friendships, or just clarity. All real."),
)

private val traitChips = listOf(
    "Personality type", "Communication style", "Love language", "Life values & dreams",
    "Humour compatibility", "Ambition alignment", "Energy & pace of life", "Conflict style",
)

private val faq = listOf(
    "What exactly is Togetha.Club?" to "India's first matchmaking travel club for verified singles. Take the quiz, book your slot for the Friday you want, pay on the website, and show up for a trip with 24 people (12 women, 12 men). Choose Himalayan (Manali · Kasol · Sissu, 5N/6D) or Udaipur · Kumbhalgarh (2N/3D) — each with GenZ and Millennial editions. Our AI matches you into the cohort where you're most likely to connect.",
    "How does the AI matching work?" to "You take a 12-question compatibility quiz (age first, then personality). Your answers become a 12-dimension profile — communication style, values, emotional availability, and more. We use that to recommend your best batch and estimate fit with the kind of people already moving toward each departure. Full preview on Our AI before you apply.",
    "What destinations and editions are available?" to "Two destinations: Himalayan Love Trail (Manali · Kasol · Sissu) and Udaipur Love Trail (Udaipur · Kumbhalgarh). Each has a GenZ Edition (ages 18–25) and Millennial Edition (ages 26–36). Same 12+12 balance, same quiz-first flow — slightly different energy and price by edition.",
    "How do I book my spot?" to "Take the 12-question quiz, pick your destination and edition, choose your Friday departure, then reserve your slot on togetha.club with the booking amount. We verify your profile within 24–36 hours, and once you're approved you pay the balance to confirm — 12 women and 12 men on the same trip, AI-matched from your quiz.",
    "Is this safe? I'm a woman thinking about coming solo." to "This is built for exactly that. Every batch is 12 women and 12 men — no exceptions. Every participant is identity-verified before they join. We have female trip leads available on request. Accommodation is in private or shared-gender rooms at vetted properties — never mixed dorms. Before departure, all women in the batch are added to a women-only WhatsApp group so you're not arriving as a stranger. If anything feels off at any point on the trip, our team is reachable 24/7. You are not alone on this trip — you have 11 other women who showed up for the same reason.",
    "What if I don't find a romantic connection?" to "Still a 6-day trip in the Himalayas with 23 interesting, vetted singles who chose to show up. Pilot batches reported deep friendships, clarity on what they want, and stories they're still telling. Romance is possible — it's not guaranteed, and that's intentional.",
    "Can I come with a friend?" to "Each person books their own slot. If you're both coming, yes — but we won't always room or group you together. The point is to meet the other 22 people, not hide in a bubble.",
    "I'm introverted — is this still for me?" to "Some of our strongest connections have been between people who don't love small talk. Activities are structured so nobody has to perform. There's free time, no forced participation, and the mountains do a lot of the work for you.",
    "What's included in the trip price?" to "Transport from Delhi, curated stays, most meals, ice-breaker activities, bonfire night, and the full batch experience. Exact inclusions vary slightly by batch — see each batch page for the line-item breakdown before you pay.",
    "What about refunds and cancellations?" to "Refund rules depend on how close you are to departure and whether we can fill your spot. Full policy is on our Cancellation & Refund page — read it before you pay so there are no surprises.",
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun HowItWorksScreen(onBack: () -> Unit, onSeeBatches: () -> Unit) {
    TrackScreen("how_it_works")
    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("How It Works", style = MaterialTheme.typography.titleMedium)
        }
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(28.dp),
        ) {
            item {
                Reveal {
                    Column {
                        Text("✦ How It Works ✦", style = MaterialTheme.typography.labelSmall, color = Amber)
                        Spacer(Modifier.height(8.dp))
                        Text(accent("Quiz → book → **mountains.**"), style = MaterialTheme.typography.displayMedium, maxLines = 3, overflow = TextOverflow.Ellipsis)
                        Spacer(Modifier.height(10.dp))
                        Text(
                            "Take the quiz, pick your Friday, pay on the website — then show up with 12 women and 12 men for 5 nights across Manali, Sissu, and Kasol.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(16.dp))
                        CaptionedPhoto(SiteImages.himalayan[3])
                        Spacer(Modifier.height(16.dp))
                        PrimaryButton("See open batches", onClick = onSeeBatches, modifier = Modifier.fillMaxWidth())
                    }
                }
            }
            item {
                Column {
                    SectionLabel("How It Works")
                    Spacer(Modifier.height(6.dp))
                    Text(accent("Four steps to **magic.**"), style = MaterialTheme.typography.headlineMedium)
                    Text(
                        "Simple enough to explain at a dinner party.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(14.dp))
                    steps.forEach { step ->
                        Card(
                            Modifier.fillMaxWidth().padding(vertical = 6.dp),
                            shape = RoundedCornerShape(Radii.card),
                        ) {
                            Row(Modifier.padding(16.dp)) {
                                Text(step.num, style = MaterialTheme.typography.displayMedium, color = Amber)
                                Spacer(Modifier.width(16.dp))
                                Column {
                                    Text(step.title, style = MaterialTheme.typography.headlineSmall)
                                    Spacer(Modifier.height(4.dp))
                                    Text(step.body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
            item {
                Column {
                    SectionLabel("The Idea")
                    Spacer(Modifier.height(6.dp))
                    Text(accent("Travel is the best **first date** you'll never plan."), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Dating apps give you a photo and a 3-line bio. We give you 6 days in the Himalayas with 23 interesting, AI-matched, verified singles who all showed up for the same reason. If there's a spark, you'll know it — and it'll be real.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(14.dp))
                    CaptionedPhoto(SiteImages.himalayan[2], height = 200.dp)
                    Spacer(Modifier.height(14.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        ideaStats.forEach { (n, title, sub) ->
                            Card(
                                Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(Radii.card),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            ) {
                                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(n, style = MaterialTheme.typography.displayMedium, color = Amber)
                                    Spacer(Modifier.width(14.dp))
                                    Column {
                                        Text(title, style = MaterialTheme.typography.titleSmall)
                                        Text(sub, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item {
                Column {
                    Text("✦ Our Secret Ingredient", style = MaterialTheme.typography.labelSmall, color = Amber)
                    Spacer(Modifier.height(6.dp))
                    Text(accent("Our AI picks your **24 batchmates.** Not randomly."), style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Every applicant fills a 10-question compatibility quiz — personality, values, communication style, love language, dreams, and the weird stuff nobody asks on dating apps. Our matching algorithm then builds each batch of 24 to maximise the probability of genuine connection, not just surface-level attraction.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "We don't just look at who you are. We look at who you need to be around.",
                        style = MaterialTheme.typography.bodyMedium,
                    )
                    Spacer(Modifier.height(12.dp))
                    CaptionedPhoto(SiteImages.himalayan[1], height = 200.dp)
                    Spacer(Modifier.height(12.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        traitChips.forEach { SiteChip(it) }
                    }
                    Spacer(Modifier.height(16.dp))
                    Card(shape = RoundedCornerShape(Radii.card)) {
                        Column(Modifier.padding(16.dp)) {
                            Text("60%", style = MaterialTheme.typography.displayLarge, color = Amber)
                            Text(
                                "of our travellers report their relationship status changing within 3 months of the trip.",
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                "Based on post-trip surveys from our 2025 pilot batches.",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Card(
                        shape = RoundedCornerShape(Radii.card),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text("How the algorithm works", style = MaterialTheme.typography.titleSmall)
                            Spacer(Modifier.height(6.dp))
                            Text(
                                "Your quiz answers are converted into a 12-dimension compatibility vector. We run a constrained optimisation across booked travelers to form a batch where average pairwise compatibility is maximised — while maintaining exact 12M/12F balance.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.height(8.dp))
                            HorizontalDivider()
                            Spacer(Modifier.height(8.dp))
                            Text(
                                "Result: you don't meet 23 random people. You meet 23 people our system thinks you'll actually connect with.",
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                    }
                }
            }
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("FAQ", style = MaterialTheme.typography.headlineMedium)
                    faq.forEach { (q, a) -> FaqItem(q, a) }
                }
            }
        }
    }
}

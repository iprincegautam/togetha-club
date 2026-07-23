package club.togetha.app.feature.site

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Radii

data class SiteItineraryDay(
    val label: String,       // e.g. "Day 0 · Delhi → Manali"
    val subtitle: String,    // e.g. "Overnight journey"
    val bullets: List<String>,
    val meals: String? = null,
)

object SiteItineraries {
    const val HIMALAYAN = "himalayan"
    const val UDAIPUR = "udaipur"

    val himalayanTitle = "5 nights · 6 days — Manali, Sissu & Kasol."
    val himalayanDays = listOf(
        SiteItineraryDay(
            "Day 0 · Delhi → Manali", "Overnight journey",
            listOf(
                "Assemble at Delhi boarding point (Majnu Ka Tilla area — exact location shared 24h before departure)",
                "Meet your batch & trip lead on the bus",
                "Ice Breaker Round 1 — names, vibes, first impressions",
                "Overnight journey to Manali — socialise with co-travellers",
            ),
        ),
        SiteItineraryDay(
            "Day 1 · Manali", "Arrival & local exploration",
            listOf(
                "Arrive Manali — hotel check-in & freshen up",
                "Hadimba Devi Temple & Van Vihar forest walk",
                "Old Manali café hopping — Ice Breaker Round 2 (paired conversations)",
                "Mall Road evening — street food, shopping & people-watching",
                "Group dinner (assigned seating) · overnight in Manali",
            ),
            "Meals included: Dinner",
        ),
        SiteItineraryDay(
            "Day 2 · Sissu & Solang", "Day trip via Atal Tunnel",
            listOf(
                "Breakfast at hotel",
                "Drive to Lahaul via Atal Tunnel — landscape shifts from Kullu to Lahaul",
                "Sissu village & Sissu Lake visit (weather permitting)",
                "Solang Valley stop — adventure activities (optional, at your own cost)",
                "Return to Manali — rooftop chai & group hangout",
                "Group dinner · overnight in Manali",
            ),
            "Meals included: Breakfast · Dinner",
        ),
        SiteItineraryDay(
            "Day 3 · Kasol", "Manali to Kasol · Parvati Valley",
            listOf(
                "Breakfast, checkout & scenic drive Manali → Kasol",
                "En route: optional paragliding or rafting at Kullu (at your own cost)",
                "Check-in at Kasol hotel/campsite",
                "Chalal bridge walk & Parvati riverside chill",
                "Café hopping — paired evening activity",
                "BONFIRE NIGHT (weather permitting) — guitar, stories & stargazing",
                "Home-style group dinner · overnight in Kasol",
            ),
            "Meals included: Breakfast · Dinner",
        ),
        SiteItineraryDay(
            "Day 4 · Manikaran → Delhi", "Hot springs & overnight return",
            listOf(
                "Breakfast & checkout from Kasol",
                "Manikaran Sahib Gurudwara — holy hot water springs & Shiva Temple",
                "Kasol local market — free time & last looks",
                "Ice Breaker Round 3 — final honesty round with the group",
                "Evening: start overnight journey back to Delhi",
            ),
            "Meals included: Breakfast",
        ),
        SiteItineraryDay(
            "Day 5 · → Delhi", "Trip ends",
            listOf(
                "Early morning arrival in Delhi",
                "Private group WhatsApp unlocked",
                "Whatever happens next is up to you.",
            ),
        ),
    )

    val udaipurTitle = "2 nights · 3 days — Udaipur & Kumbhalgarh."
    val udaipurDays = listOf(
        SiteItineraryDay(
            "Day 0 · Gurugram → Udaipur", "The overnight journey",
            listOf(
                "Assemble at the Gurugram boarding point (exact details shared 24 hours before departure)",
                "Settle onto a comfortable AC coach and leave overnight for Udaipur",
                "Easy hellos with your hand-matched batch — arrive already knowing a few faces",
            ),
        ),
        SiteItineraryDay(
            "Day 1 · Udaipur · City of Lakes", "Lakes, bazaars & Bollywood night",
            listOf(
                "Arrive Udaipur — hotel check-in & freshen up",
                "Saheliyon Ki Bari, Maharana Pratap Memorial & Under the Sun Aquarium",
                "Fatehsagar Lake sunset + street-food market",
                "The Bollywood House Party — themed, host-led, verified-guests-only and zero pressure",
                "Antakshari: Wingman Edition · Guess the Jodi · Filmy Charades · Two Truths, Filmy Style",
                "Group dinner · overnight in Udaipur",
            ),
            "Meals included: Dinner",
        ),
        SiteItineraryDay(
            "Day 2 · Udaipur Old City", "Palaces, ghats & lake-view cafés",
            listOf(
                "Breakfast at hotel",
                "City Palace and Mewar history",
                "Jagdish Temple and Karni Mata Temple",
                "Bagore Ki Haveli folk-art show or café-hopping along Lake Pichola and Gangaur Ghat",
                "Paired café walks and thoughtfully seated group dinner for easy, real conversation",
                "Group dinner · overnight in Udaipur",
            ),
            "Meals included: Breakfast · Dinner",
        ),
        SiteItineraryDay(
            "Day 3 · Kumbhalgarh → Gurugram", "The Great Wall of India",
            listOf(
                "Breakfast & checkout from hotel",
                "Drive to UNESCO-listed Kumbhalgarh Fort and walk its astonishing 38 km rampart",
                "A slow walk and sunset view — the final chance to see who you are drawn to",
                "Begin the overnight journey home",
            ),
            "Meals included: Breakfast",
        ),
        SiteItineraryDay(
            "Day 4 · → Gurugram", "Home, with a new circle",
            listOf(
                "Early morning arrival in Gurugram",
                "Your private, verified batch group stays open",
                "No forced matches, no reveal, no scores. Who you keep talking to is entirely up to you.",
            ),
        ),
    )
}

private val outcomes = listOf(
    Triple("♡", "23 people who still text back", "The batch becomes the group chat you actually reply to — long after the bus drops you home."),
    Triple("✦", "Maybe a spark", "Off-grid, no filter, no pressure. No promises — but if it's real, you'll both know it."),
    Triple("❤", "Stories you'll tell for years", "The bonfire, the 2am drive, the conversation you didn't want to end."),
    Triple("◈", "Clarity on what you want", "Even if the whole takeaway is just knowing what you're actually looking for."),
)

@Composable
fun ItinerariesScreen(onBack: () -> Unit, initialTrip: String = SiteItineraries.HIMALAYAN) {
    TrackScreen("itineraries")
    var trip by rememberSaveable { mutableStateOf(initialTrip) }
    val himalayan = trip == SiteItineraries.HIMALAYAN

    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("Itineraries", style = MaterialTheme.typography.titleMedium)
        }
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            item {
                Reveal {
                    Column {
                        Text("✦ Itineraries ✦", style = MaterialTheme.typography.labelSmall, color = Amber)
                        Spacer(Modifier.height(8.dp))
                        Text(accent("See exactly **where you'll go.**"), style = MaterialTheme.typography.displayMedium, maxLines = 3, overflow = TextOverflow.Ellipsis)
                        Spacer(Modifier.height(10.dp))
                        Text(
                            "The full day-by-day for every Togetha trip — the route, the vibe, and what you leave with. No sign-up to look. When a trip feels like yours, take the 2-minute compatibility quiz and we'll match you into your best-fit batch.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            item {
                SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                    SegmentedButton(
                        selected = himalayan,
                        onClick = { trip = SiteItineraries.HIMALAYAN },
                        shape = SegmentedButtonDefaults.itemShape(0, 2),
                    ) { Text("Himalayan 5N/6D") }
                    SegmentedButton(
                        selected = !himalayan,
                        onClick = { trip = SiteItineraries.UDAIPUR },
                        shape = SegmentedButtonDefaults.itemShape(1, 2),
                    ) { Text("Udaipur 2N/3D") }
                }
            }
            item {
                GalleryPager(if (himalayan) SiteImages.himalayan else SiteImages.udaipur)
            }
            item {
                Text(
                    if (himalayan) SiteItineraries.himalayanTitle else SiteItineraries.udaipurTitle,
                    style = MaterialTheme.typography.headlineMedium,
                )
            }
            val days = if (himalayan) SiteItineraries.himalayanDays else SiteItineraries.udaipurDays
            items(days.size) { i ->
                val day = days[i]
                ExpandableRow(title = day.label, subtitle = day.subtitle, initiallyExpanded = i == 0) {
                    Column {
                        day.bullets.forEach {
                            Row(Modifier.padding(vertical = 3.dp)) {
                                Text("·", style = MaterialTheme.typography.bodySmall, color = Amber)
                                Spacer(Modifier.width(8.dp))
                                Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        if (day.meals != null) {
                            Spacer(Modifier.height(6.dp))
                            Text(day.meals, style = MaterialTheme.typography.labelMedium, color = Amber)
                        }
                    }
                }
            }
            item {
                Column {
                    SectionLabel("What you leave with")
                    Spacer(Modifier.height(6.dp))
                    Text("The part that outlasts the trip.", style = MaterialTheme.typography.headlineMedium)
                    Spacer(Modifier.height(12.dp))
                    outcomes.forEach { (glyph, title, body) ->
                        Card(
                            Modifier.fillMaxWidth().padding(vertical = 5.dp),
                            shape = RoundedCornerShape(Radii.card),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        ) {
                            Row(Modifier.padding(16.dp)) {
                                Text(glyph, style = MaterialTheme.typography.headlineMedium, color = Amber)
                                Spacer(Modifier.width(14.dp))
                                Column {
                                    Text(title, style = MaterialTheme.typography.titleSmall)
                                    Spacer(Modifier.height(4.dp))
                                    Text(body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "No outcome is promised. In our pilot batches, most people came home with at least one of these — and often more than they expected.",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(40.dp))
                }
            }
        }
    }
}

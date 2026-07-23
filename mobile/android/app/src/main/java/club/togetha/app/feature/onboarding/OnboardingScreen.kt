package club.togetha.app.feature.onboarding

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.components.VerifiedBadge
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.AmberSoft
import club.togetha.app.ui.theme.Forest
import club.togetha.app.ui.theme.ForestDeep
import club.togetha.app.ui.theme.OffWhite
import club.togetha.app.ui.theme.SurfaceDark
import club.togetha.app.ui.theme.WomenAccent
import kotlinx.coroutines.launch

private data class Page(
    val kicker: String,
    val headline: String,
    val body: String,
    val gradient: List<Color>,
)

private val pages = listOf(
    Page(
        "TOGETHA.CLUB",
        "Travel with strangers.",
        "Curated small-group trips across India, built for singles who'd rather meet people in the mountains than on an app.",
        listOf(Forest, ForestDeep),
    ),
    Page(
        "THE POINT",
        "Leave with your person.",
        "We match you onto a batch where the mix genuinely fits — same pace, same intent. What happens on the trip is yours.",
        listOf(ForestDeep, SurfaceDark),
    ),
    Page(
        "TRUST, BUILT IN",
        "Screened. Verified. Women-majority.",
        "Every application is reviewed by a human — no instant approvals, ever. A recent batch: 14 women, 9 men, all identity-verified.",
        listOf(Color(0xFF2C2430), ForestDeep),
    ),
    Page(
        "HOW IT WORKS",
        "Apply. Get screened. Get matched.",
        "A deposit reserves your screening slot. A real person reviews your application in 24–36 hours — then, if it's a fit, you're in.",
        listOf(Forest, SurfaceDark),
    ),
)

@Composable
fun OnboardingScreen(onDone: () -> Unit) {
    val pagerState = rememberPagerState { pages.size }
    val scope = rememberCoroutineScope()

    Box(Modifier.fillMaxSize()) {
        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxSize()) { index ->
            val page = pages[index]
            Box(
                Modifier
                    .fillMaxSize()
                    .background(Brush.verticalGradient(page.gradient))
            ) {
                Column(
                    Modifier
                        .align(Alignment.BottomStart)
                        .padding(horizontal = 28.dp)
                        .padding(bottom = 180.dp)
                ) {
                    Text(page.kicker, style = MaterialTheme.typography.labelSmall, color = Amber)
                    Spacer(Modifier.height(12.dp))
                    Text(page.headline, style = MaterialTheme.typography.displayLarge, color = OffWhite, maxLines = 3, overflow = TextOverflow.Ellipsis)
                    Spacer(Modifier.height(14.dp))
                    Text(page.body, style = MaterialTheme.typography.bodyLarge, color = OffWhite.copy(alpha = 0.82f))
                    if (index == 2) {
                        Spacer(Modifier.height(16.dp))
                        Row {
                            VerifiedBadge("Identity-verified")
                            Spacer(Modifier.width(8.dp))
                            VerifiedBadge("Human-screened")
                        }
                    }
                }
            }
        }

        Column(
            Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(horizontal = 28.dp, vertical = 24.dp)
        ) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                pages.indices.forEach { i ->
                    val selected = pagerState.currentPage == i
                    val w by animateDpAsState(if (selected) 22.dp else 8.dp, label = "dot")
                    Box(
                        Modifier
                            .padding(3.dp)
                            .height(8.dp)
                            .width(w)
                            .clip(CircleShape)
                            .background(if (selected) Amber else AmberSoft.copy(alpha = 0.35f))
                    )
                }
            }
            Spacer(Modifier.height(16.dp))
            val last = pagerState.currentPage == pages.lastIndex
            PrimaryButton(
                text = if (last) "Find my people" else "Continue",
                onClick = {
                    if (last) onDone()
                    else scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                },
                modifier = Modifier.fillMaxWidth(),
            )
            if (!last) {
                TextButton(onClick = onDone, modifier = Modifier.align(Alignment.CenterHorizontally)) {
                    Text("Skip", color = OffWhite.copy(alpha = 0.7f))
                }
            } else {
                Spacer(Modifier.height(12.dp))
                Text(
                    "Applying doesn't guarantee a seat — every traveller is screened first.",
                    style = MaterialTheme.typography.labelSmall,
                    color = OffWhite.copy(alpha = 0.6f),
                    modifier = Modifier.align(Alignment.CenterHorizontally),
                )
            }
        }

        Box(Modifier.statusBarsPadding().align(Alignment.TopEnd).padding(8.dp)) {
            Text(
                "women-majority club",
                style = MaterialTheme.typography.labelSmall,
                color = WomenAccent,
                modifier = Modifier.padding(8.dp),
            )
        }
    }
}

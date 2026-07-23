package club.togetha.app.feature.site

import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.spring
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import club.togetha.app.R
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Ink
import club.togetha.app.ui.theme.Radii

/** A production image + its verbatim caption from the website image map. */
data class SiteImage(@DrawableRes val res: Int, val caption: String)

object SiteImages {
    val himalayanCover = SiteImage(R.drawable.himalayan_dating_apps_fatigue, "Done with dating apps — ready for the mountains")
    val udaipurCover = SiteImage(R.drawable.udaipur_dating_apps_fatigue, "Done with dating apps — ready for the lakes")

    val himalayan = listOf(
        himalayanCover,
        SiteImage(R.drawable.himalayan_matchmaking_machine, "The matchmaking machine — companions, not coincidences"),
        SiteImage(R.drawable.himalayan_campfire_friendships, "Manali · Kasol · Sissu — real friendships around the fire"),
        SiteImage(R.drawable.himalayan_how_it_works_funnel, "Quiz → match → pick your Friday → human review"),
        SiteImage(R.drawable.himalayan_safety_verified, "Your safety is the product — verified by a real person"),
    )

    val udaipur = listOf(
        udaipurCover,
        SiteImage(R.drawable.udaipur_anonymous_profiles, "Who are these strangers — is it safe?"),
        SiteImage(R.drawable.udaipur_bollywood_house_party, "Bollywood house party — 12+12 balanced & verified"),
        SiteImage(R.drawable.udaipur_lake_friendships, "Udaipur · Kumbhalgarh — real friendships and a story"),
        SiteImage(R.drawable.udaipur_how_it_works_funnel, "Quiz → match → pick your weekend → human review"),
        SiteImage(R.drawable.udaipur_safety_verified, "Your safety is the product — verified by a real human"),
    )

    val posters = listOf(
        Triple(R.drawable.poster_01, "Ananya", "Content creator and Dancer · Kolkata"),
        Triple(R.drawable.poster_02, "Shrutika", "Digital Marketer · Delhi"),
        Triple(R.drawable.poster_03, "Bhumi", "Software Engineer · Bangalore"),
    )

    fun coverFor(batchId: String): SiteImage? = when (batchId) {
        "batch-a", "batch-b" -> himalayanCover
        "batch-d", "batch-e" -> udaipurCover
        else -> null
    }

    fun galleryFor(batchId: String): List<SiteImage> = when (batchId) {
        "batch-a", "batch-b" -> himalayan
        "batch-d", "batch-e" -> udaipur
        else -> emptyList()
    }
}

/**
 * Renders website copy where **…** markers mean accent/serif emphasis
 * (never literal asterisks): emphasised spans render in Amber.
 */
fun accent(raw: String, accentColor: Color = Amber) = buildAnnotatedString {
    var rest = raw
    while (true) {
        val start = rest.indexOf("**")
        if (start < 0) { append(rest); break }
        val end = rest.indexOf("**", start + 2)
        if (end < 0) { append(rest); break }
        append(rest.substring(0, start))
        withStyle(SpanStyle(color = accentColor)) { append(rest.substring(start + 2, end)) }
        rest = rest.substring(end + 2)
    }
}

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text.uppercase(),
        modifier = modifier,
        style = MaterialTheme.typography.labelSmall,
        color = Amber,
    )
}

@Composable
fun SiteChip(text: String, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(999.dp),
        color = MaterialTheme.colorScheme.secondaryContainer,
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            style = MaterialTheme.typography.labelMedium,
        )
    }
}

/** Rubber-stamp style badge used across Safety / Mystery sections. */
@Composable
fun Stamp(text: String, modifier: Modifier = Modifier, color: Color = Amber) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(4.dp),
        color = Color.Transparent,
        border = androidx.compose.foundation.BorderStroke(1.5.dp, color),
    ) {
        Text(
            text.uppercase(),
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = color,
        )
    }
}

/** Spring slide+fade reveal for section content. */
@Composable
fun Reveal(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    var shown by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { shown = true }
    AnimatedVisibility(
        visible = shown,
        modifier = modifier,
        enter = fadeIn(spring(stiffness = 200f)) +
            slideInVertically(spring(dampingRatio = 0.8f, stiffness = 220f)) { it / 8 },
    ) { content() }
}

/** Real photo with a bottom scrim + caption for legibility. */
@Composable
fun CaptionedPhoto(image: SiteImage, modifier: Modifier = Modifier, height: androidx.compose.ui.unit.Dp = 220.dp) {
    Box(
        modifier
            .fillMaxWidth()
            .height(height)
            .clip(RoundedCornerShape(Radii.card))
    ) {
        Image(
            painterResource(image.res),
            contentDescription = image.caption,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        Box(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.65f))))
        ) {
            Text(
                image.caption,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                style = MaterialTheme.typography.labelMedium,
                color = Color.White,
            )
        }
    }
}

/** Swipeable gallery of real photos with exact captions. */
@Composable
fun GalleryPager(images: List<SiteImage>, modifier: Modifier = Modifier, height: androidx.compose.ui.unit.Dp = 240.dp) {
    if (images.isEmpty()) return
    val state = rememberPagerState { images.size }
    Column(modifier) {
        HorizontalPager(state = state, pageSpacing = 12.dp) { page ->
            CaptionedPhoto(images[page], height = height)
        }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.align(Alignment.CenterHorizontally)) {
            repeat(images.size) { i ->
                Box(
                    Modifier
                        .padding(horizontal = 3.dp)
                        .height(6.dp)
                        .width(if (i == state.currentPage) 18.dp else 6.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(if (i == state.currentPage) Amber else MaterialTheme.colorScheme.surfaceVariant)
                )
            }
        }
    }
}

/** Expandable FAQ / accordion row. */
@Composable
fun ExpandableRow(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    initiallyExpanded: Boolean = false,
    content: @Composable () -> Unit,
) {
    var expanded by remember { mutableStateOf(initiallyExpanded) }
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(Radii.card),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(Modifier.clickable { expanded = !expanded }.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(title, style = MaterialTheme.typography.titleSmall)
                    if (subtitle != null) {
                        Text(subtitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Text(if (expanded) "−" else "+", style = MaterialTheme.typography.titleMedium, color = Amber)
            }
            AnimatedVisibility(
                visible = expanded,
                enter = fadeIn() + expandVertically(spring(dampingRatio = 0.85f, stiffness = 300f)),
                exit = shrinkVertically(),
            ) {
                Column(Modifier.padding(top = 10.dp)) { content() }
            }
        }
    }
}

@Composable
fun FaqItem(question: String, answer: String, modifier: Modifier = Modifier) {
    ExpandableRow(title = question, modifier = modifier) {
        Text(answer, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

/** "✦ Real stories ✦ / Hear it from them" video-poster strip. */
@Composable
fun PosterStrip(modifier: Modifier = Modifier) {
    Column(modifier) {
        Text("✦ Real stories ✦", style = MaterialTheme.typography.labelSmall, color = Amber)
        Spacer(Modifier.height(4.dp))
        Text("Hear it from them", style = MaterialTheme.typography.headlineMedium)
        Text(
            "Swipe through video postcards from past travellers.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(12.dp))
        Row {
            SiteImages.posters.forEach { (res, name, role) ->
                Column(Modifier.weight(1f).padding(end = 10.dp)) {
                    Box(Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(Radii.card))) {
                        Image(
                            painterResource(res),
                            contentDescription = name,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop,
                        )
                        Box(
                            Modifier
                                .align(Alignment.BottomCenter)
                                .fillMaxWidth()
                                .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))))
                                .padding(8.dp)
                        ) {
                            Text(name, style = MaterialTheme.typography.labelLarge, color = Color.White)
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(role, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

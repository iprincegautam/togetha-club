package club.togetha.app.core.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import club.togetha.app.core.model.TripPhoto
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Forest
import club.togetha.app.ui.theme.Ink
import club.togetha.app.ui.theme.Motion
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import club.togetha.app.ui.theme.WomenAccent

/** Animated women/men balance bar — trust surface, not decoration. */
@Composable
fun GenderBalanceBar(womenCount: Int, menCount: Int, modifier: Modifier = Modifier) {
    val total = (womenCount + menCount).coerceAtLeast(1)
    var target by remember { mutableStateOf(0f) }
    LaunchedEffect(womenCount, menCount) { target = womenCount.toFloat() / total }
    val fraction by animateFloatAsState(
        targetValue = target,
        animationSpec = Motion.springBase(),
        label = "genderBalance",
    )
    Column(modifier = modifier) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Box(
                Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(fraction.coerceIn(0.02f, 1f))
                    .background(WomenAccent)
            )
            Box(
                Modifier
                    .fillMaxHeight()
                    .weight(1f)
                    .background(Forest.copy(alpha = 0.55f))
            )
        }
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                "$womenCount women",
                style = MaterialTheme.typography.labelMedium,
                color = WomenAccent,
            )
            Text(
                "$menCount men",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
fun VerifiedBadge(label: String = "Verified", modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(999.dp),
        color = Success.copy(alpha = 0.14f),
    ) {
        Row(
            Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Filled.Verified, contentDescription = null, tint = Success, modifier = Modifier.size(14.dp))
            Spacer(Modifier.size(4.dp))
            Text(label, style = MaterialTheme.typography.labelMedium, color = Success)
        }
    }
}

/** Amber primary CTA with spring press-scale. */
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) 0.96f else 1f,
        animationSpec = Motion.springSnappy(),
        label = "pressScale",
    )
    Button(
        onClick = onClick,
        enabled = enabled,
        interactionSource = interaction,
        modifier = modifier.scale(scale).height(52.dp),
        shape = RoundedCornerShape(Radii.button),
        colors = ButtonDefaults.buttonColors(containerColor = Amber, contentColor = Ink),
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

/** Explains the human-screening gate. Never implies instant confirmation. */
@Composable
fun ScreeningExplainerCard(modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(Radii.card),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.HourglassTop, contentDescription = null, tint = Amber, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
                Text("A human screens every application", style = MaterialTheme.typography.titleSmall)
            }
            Spacer(Modifier.height(8.dp))
            Text(
                "Your deposit reserves a screening slot — it doesn't confirm a seat. " +
                    "A real person on our team reviews your application, and you'll hear back in 24–36 hours. " +
                    "If it's not a fit, your deposit comes straight back.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/**
 * Feed photo tile — a uniform square cell (1:1) so 2-column grid rows always align.
 * Image is cropped to fill; caption + badges are overlaid so cell height never varies.
 */
@Composable
fun PhotoCard(
    photo: TripPhoto,
    modifier: Modifier = Modifier,
) {
    Card(modifier = modifier.aspectRatio(1f), shape = RoundedCornerShape(Radii.card)) {
        Box(Modifier.fillMaxSize().clip(RoundedCornerShape(Radii.card))) {
            val gallery = club.togetha.app.feature.site.SiteImages.galleryFor(photo.batchId)
            if (gallery.isNotEmpty()) {
                val img = gallery[kotlin.math.abs(photo.id.hashCode()) % gallery.size]
                androidx.compose.foundation.Image(
                    androidx.compose.ui.res.painterResource(img.res),
                    contentDescription = photo.caption,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                )
            } else {
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(photo.tint), Color(photo.tint).copy(alpha = 0.7f))
                            )
                        )
                )
            }
            Column(
                Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.55f))))
                    .padding(10.dp)
            ) {
                if (photo.isMine) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("You", style = MaterialTheme.typography.labelSmall, color = Amber)
                        if (club.togetha.app.core.state.AppState.isVerified) {
                            Spacer(Modifier.size(3.dp))
                            Icon(
                                Icons.Filled.Verified,
                                contentDescription = "Verified",
                                tint = Amber,
                                modifier = Modifier.size(12.dp),
                            )
                        }
                    }
                }
                Text(
                    photo.caption,
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                )
                Text(
                    photo.batchName,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White.copy(alpha = 0.8f),
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                )
            }
            if (!photo.approved) {
                Surface(
                    modifier = Modifier.align(Alignment.TopStart).padding(8.dp),
                    shape = RoundedCornerShape(999.dp),
                    color = Amber.copy(alpha = 0.92f),
                ) {
                    Text(
                        "Waiting for review",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = Ink,
                    )
                }
            }
        }
    }
}

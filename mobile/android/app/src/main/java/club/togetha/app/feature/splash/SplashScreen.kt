package club.togetha.app.feature.splash

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import club.togetha.app.R
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Forest
import club.togetha.app.ui.theme.ForestDeep
import club.togetha.app.ui.theme.OffWhite
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Animated cold-start splash: the pin-and-mountain logo springs in with a gentle
 * overshoot over forest green while a mountain gradient fades up, then the app
 * crossfades to its start destination (~1.6s). Respects the system animator scale.
 */
@Composable
fun SplashScreen(onFinished: () -> Unit) {
    val context = LocalContext.current
    val animScale = remember {
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    }
    val logoScale = remember { Animatable(0.55f) }
    val logoAlpha = remember { Animatable(0f) }
    val gradientAlpha = remember { Animatable(0f) }
    val wordmarkAlpha = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        if (animScale == 0f) { onFinished(); return@LaunchedEffect }
        launch { gradientAlpha.animateTo(1f, tween((900 * animScale).toInt())) }
        launch { logoAlpha.animateTo(1f, tween((350 * animScale).toInt())) }
        launch {
            logoScale.animateTo(
                1f,
                spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
            )
        }
        delay((550 * animScale).toLong())
        wordmarkAlpha.animateTo(1f, tween((400 * animScale).toInt()))
        delay((650 * animScale).toLong())
        onFinished()
    }

    Box(Modifier.fillMaxSize().background(Forest)) {
        // Subtle mountain gradient rising from the bottom.
        Box(
            Modifier
                .fillMaxSize()
                .alpha(gradientAlpha.value * 0.85f)
                .background(
                    Brush.verticalGradient(
                        0f to Forest,
                        0.55f to Forest,
                        1f to ForestDeep,
                    )
                )
        )
        Column(Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
            Image(
                painter = painterResource(R.drawable.logo),
                contentDescription = "Togetha",
                modifier = Modifier
                    .size(120.dp)
                    .scale(logoScale.value)
                    .alpha(logoAlpha.value),
            )
            Spacer(Modifier.height(20.dp))
            Text(
                "togetha.",
                style = MaterialTheme.typography.displayMedium,
                color = OffWhite,
                modifier = Modifier.alpha(wordmarkAlpha.value),
            )
            Text(
                "apply · screen · match",
                style = MaterialTheme.typography.labelSmall,
                color = Amber,
                modifier = Modifier.alpha(wordmarkAlpha.value),
            )
        }
    }
}

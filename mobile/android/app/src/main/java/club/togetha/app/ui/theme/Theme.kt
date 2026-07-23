package club.togetha.app.ui.theme

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

// Motion tokens — spring specs from design/tokens.json
object Motion {
    fun <T> springBase() = spring<T>(dampingRatio = 0.82f, stiffness = Spring.StiffnessMediumLow)
    fun <T> springSnappy() = spring<T>(dampingRatio = 0.9f, stiffness = Spring.StiffnessMedium)
}

object Radii {
    val card = 20.dp
    val button = 14.dp
    val sheet = 28.dp
}

private val LightColors = lightColorScheme(
    primary = Forest,
    onPrimary = OffWhite,
    primaryContainer = Forest,
    onPrimaryContainer = OffWhite,
    secondary = Amber,
    onSecondary = Ink,
    secondaryContainer = AmberSoft,
    onSecondaryContainer = Ink,
    tertiary = WomenAccent,
    onTertiary = Color.White,
    background = OffWhite,
    onBackground = Ink,
    surface = OffWhite,
    onSurface = Ink,
    surfaceVariant = Color(0xFFEFE9DF),
    onSurfaceVariant = InkMuted,
    outline = Color(0xFFD8D2C6),
    error = Danger,
    onError = Color.White,
)

private val DarkColors = darkColorScheme(
    primary = AmberSoft,
    onPrimary = ForestDeep,
    primaryContainer = CardDark,
    onPrimaryContainer = OffWhite,
    secondary = Amber,
    onSecondary = Ink,
    secondaryContainer = Forest,
    onSecondaryContainer = OffWhite,
    tertiary = WomenAccent,
    onTertiary = Color.White,
    background = SurfaceDark,
    onBackground = OffWhite,
    surface = SurfaceDark,
    onSurface = OffWhite,
    surfaceVariant = CardDark,
    onSurfaceVariant = Color(0xFFA6ADA8),
    outline = Color(0xFF33443F),
    error = Danger,
    onError = Color.White,
)

private val TogethaShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(Radii.button),
    large = RoundedCornerShape(Radii.card),
    extraLarge = RoundedCornerShape(Radii.sheet),
)

@Composable
fun TogethaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = togethaTypography(),
        shapes = TogethaShapes,
        content = content,
    )
}

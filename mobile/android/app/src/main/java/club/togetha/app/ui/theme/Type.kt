package club.togetha.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import kotlin.math.min

val Serif = FontFamily.Serif
val Sans = FontFamily.SansSerif

// Display (serif) styles use a CAPPED effective font scale so huge system font
// sizes (1.3x–2.0x) don't let heroes dominate the screen. Body/label styles keep
// normal sp scaling for accessibility. A width factor also shrinks display sizes
// proportionally on narrow phones (< 393dp), floored at 0.85.
private const val DISPLAY_FONT_SCALE_CAP = 1.2f
private const val REFERENCE_WIDTH_DP = 393f
private const val MIN_WIDTH_FACTOR = 0.85f

@Composable
fun togethaTypography(): Typography {
    val fontScale = LocalDensity.current.fontScale
    val screenWidthDp = LocalConfiguration.current.screenWidthDp
    // sp already multiplies by fontScale; dividing by it and re-multiplying by the
    // capped scale yields an effective scale of min(fontScale, cap).
    val scaleCapFactor = if (fontScale > 0f) min(fontScale, DISPLAY_FONT_SCALE_CAP) / fontScale else 1f
    val widthFactor = min(1f, screenWidthDp / REFERENCE_WIDTH_DP).coerceAtLeast(MIN_WIDTH_FACTOR)
    val d = scaleCapFactor * widthFactor

    fun display(size: Float, weight: FontWeight, lineHeight: Float? = null) = TextStyle(
        fontFamily = Serif,
        fontSize = (size * d).sp,
        fontWeight = weight,
        lineHeight = if (lineHeight != null) (lineHeight * d).sp else androidx.compose.ui.unit.TextUnit.Unspecified,
    )

    return Typography(
        displayLarge = display(34f, FontWeight.SemiBold, 40f),
        displayMedium = display(28f, FontWeight.SemiBold, 34f),
        headlineMedium = display(22f, FontWeight.SemiBold, 28f),
        headlineSmall = display(19f, FontWeight.Medium, 24f),
        titleLarge = display(22f, FontWeight.SemiBold),
        titleMedium = TextStyle(fontFamily = Sans, fontSize = 16.sp, fontWeight = FontWeight.SemiBold),
        titleSmall = TextStyle(fontFamily = Sans, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
        bodyLarge = TextStyle(fontFamily = Sans, fontSize = 16.sp, lineHeight = 23.sp),
        bodyMedium = TextStyle(fontFamily = Sans, fontSize = 14.sp, lineHeight = 20.sp),
        bodySmall = TextStyle(fontFamily = Sans, fontSize = 13.sp, lineHeight = 18.sp),
        labelLarge = TextStyle(fontFamily = Sans, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
        labelMedium = TextStyle(fontFamily = Sans, fontSize = 12.sp, fontWeight = FontWeight.Medium),
        labelSmall = TextStyle(fontFamily = Sans, fontSize = 11.sp, fontWeight = FontWeight.Medium, letterSpacing = 0.5.sp),
    )
}

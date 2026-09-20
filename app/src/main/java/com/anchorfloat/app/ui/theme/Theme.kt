package com.anchorfloat.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val AnchorColorScheme = lightColorScheme(
    primary = SageGreen,
    onPrimary = Color(0xFFFAF6EE),
    primaryContainer = Color(0xFFD5DCCF),
    onPrimaryContainer = SoftCharcoal,
    secondary = SlateGrey,
    onSecondary = Color(0xFFFAF6EE),
    secondaryContainer = Color(0xFFD9DEE2),
    onSecondaryContainer = SoftCharcoal,
    tertiary = MutedAmber,
    onTertiary = SoftCharcoal,
    tertiaryContainer = Color(0xFFF3E3C8),
    onTertiaryContainer = SoftCharcoal,
    background = Paper,
    onBackground = SoftCharcoal,
    surface = PaperElevated,
    onSurface = SoftCharcoal,
    surfaceVariant = PaperInset,
    onSurfaceVariant = SlateGrey,
    outline = OutlineQuiet,
    outlineVariant = Color(0xFFE4DCCC),
    error = DustyRose,
    onError = Color(0xFFFAF6EE),
    errorContainer = Color(0xFFEEDFCC),
    onErrorContainer = SoftCharcoal,
    inverseSurface = SoftCharcoal,
    inverseOnSurface = Paper,
    inversePrimary = SageGreen,
    scrim = SoftCharcoal.copy(alpha = 0.45f),
    surfaceTint = Color.Transparent,
)

private val AnchorShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp),
)

@Composable
fun AnchorFloatTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AnchorColorScheme,
        typography = AnchorTypography,
        shapes = AnchorShapes,
        content = content,
    )
}

val MinTouchTarget = 48.dp
val ComfortableTouchTarget = 56.dp

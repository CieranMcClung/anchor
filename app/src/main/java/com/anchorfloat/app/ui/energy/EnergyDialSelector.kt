package com.anchorfloat.app.ui.energy

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.ui.theme.ComfortableTouchTarget
import com.anchorfloat.app.ui.theme.DustyRose
import com.anchorfloat.app.ui.theme.MutedAmber
import com.anchorfloat.app.ui.theme.OutlineQuiet
import com.anchorfloat.app.ui.theme.PaperElevated
import com.anchorfloat.app.ui.theme.SageGreen
import com.anchorfloat.app.ui.theme.SoftCharcoal

@Composable
fun EnergyDialSelector(
    energy: EnergyLevel,
    onSelect: (EnergyLevel) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            text = "Energy",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(PaperElevated)
                .border(1.dp, OutlineQuiet, RoundedCornerShape(22.dp))
                .padding(6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            EnergyLevel.entries.forEach { level ->
                EnergySegment(
                    level = level,
                    selected = level == energy,
                    onSelect = { onSelect(level) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
        Text(
            text = energy.description,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun EnergySegment(
    level: EnergyLevel,
    selected: Boolean,
    onSelect: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tone = when (level) {
        EnergyLevel.GREEN -> SageGreen
        EnergyLevel.AMBER -> MutedAmber
        EnergyLevel.RED -> DustyRose
    }
    val background by animateColorAsState(
        targetValue = if (selected) tone else Color.Transparent,
        label = "energy-fill",
    )
    val content by animateColorAsState(
        targetValue = if (selected) PaperElevated else SoftCharcoal,
        label = "energy-ink",
    )
    Box(
        modifier = modifier
            .heightIn(min = ComfortableTouchTarget)
            .clip(RoundedCornerShape(16.dp))
            .background(background)
            .semantics { this.selected = selected }
            .clickable(role = Role.Tab, onClick = onSelect)
            .padding(horizontal = 8.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = level.shortLabel,
            style = MaterialTheme.typography.labelLarge,
            color = content,
        )
    }
}

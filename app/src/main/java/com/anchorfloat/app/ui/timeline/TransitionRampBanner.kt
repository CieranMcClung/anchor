package com.anchorfloat.app.ui.timeline

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.anchorfloat.app.domain.ramp.TransitionRamp
import com.anchorfloat.app.ui.theme.ComfortableTouchTarget
import com.anchorfloat.app.ui.theme.PaperInset
import com.anchorfloat.app.ui.theme.SageGreen

@Composable
fun TransitionRampBanner(
    ramp: TransitionRamp,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(PaperInset, RoundedCornerShape(20.dp))
            .padding(horizontal = 18.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = "A gentle turn",
            style = MaterialTheme.typography.labelMedium,
            color = SageGreen,
        )
        Text(
            text = "${ramp.anchor.clockLabel}  ·  ${ramp.anchor.title}",
            style = MaterialTheme.typography.titleMedium,
        )
        Text(
            text = ramp.suggestion,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.heightIn(min = ComfortableTouchTarget),
            ) {
                Text("I’ll ease in")
            }
        }
    }
}

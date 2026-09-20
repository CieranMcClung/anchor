package com.anchorfloat.app.ui.unstuck

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.unstuck.UnstuckMicroAction
import com.anchorfloat.app.ui.theme.ComfortableTouchTarget
import com.anchorfloat.app.ui.theme.DustyRose
import com.anchorfloat.app.ui.theme.MutedAmber
import com.anchorfloat.app.ui.theme.Paper
import com.anchorfloat.app.ui.theme.SageGreen
import com.anchorfloat.app.ui.theme.SoftCharcoal

@Composable
fun UnstuckOverlay(
    action: UnstuckMicroAction,
    focused: FloatTask?,
    onBreakSmaller: () -> Unit,
    onSwap: () -> Unit,
    onDoneNext: () -> Unit,
    onDismiss: () -> Unit,
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false,
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Paper)
                .systemBarsPadding()
                .padding(horizontal = 24.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = "Unstuck",
                    style = MaterialTheme.typography.labelMedium,
                    color = toneFor(action.energy),
                )
                Text(
                    text = action.title,
                    style = MaterialTheme.typography.displaySmall,
                    color = SoftCharcoal,
                )
                Text(
                    text = action.body,
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (focused != null) {
                    Text(
                        text = "Holding: ${focused.title}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier
                            .padding(top = 8.dp)
                            .background(
                                MaterialTheme.colorScheme.surfaceVariant,
                                RoundedCornerShape(14.dp),
                            )
                            .padding(horizontal = 14.dp, vertical = 12.dp)
                            .fillMaxWidth(),
                    )
                }
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OutlinedButton(
                    onClick = onBreakSmaller,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = ComfortableTouchTarget),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Break smaller")
                }
                OutlinedButton(
                    onClick = onSwap,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = ComfortableTouchTarget),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Swap task")
                }
                Button(
                    onClick = onDoneNext,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = ComfortableTouchTarget),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SageGreen,
                        contentColor = Paper,
                    ),
                ) {
                    Text("Done / Next")
                }
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.heightIn(min = ComfortableTouchTarget),
                ) {
                    Text("Step back")
                }
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

private fun toneFor(energy: EnergyLevel) = when (energy) {
    EnergyLevel.GREEN -> SageGreen
    EnergyLevel.AMBER -> MutedAmber
    EnergyLevel.RED -> DustyRose
}

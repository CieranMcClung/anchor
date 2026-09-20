package com.anchorfloat.app.ui.timeline

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Spa
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FabPosition
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.anchorfloat.app.domain.model.Anchor
import com.anchorfloat.app.domain.model.AnchorTimeline
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.model.TaskStatus
import com.anchorfloat.app.ui.energy.EnergyDialSelector
import com.anchorfloat.app.ui.theme.AnchorFloatTheme
import com.anchorfloat.app.ui.theme.ComfortableTouchTarget
import com.anchorfloat.app.ui.theme.DustyRose
import com.anchorfloat.app.ui.theme.MinTouchTarget
import com.anchorfloat.app.ui.theme.MutedAmber
import com.anchorfloat.app.ui.theme.OutlineQuiet
import com.anchorfloat.app.ui.theme.Paper
import com.anchorfloat.app.ui.theme.PaperElevated
import com.anchorfloat.app.ui.theme.SageGreen
import com.anchorfloat.app.ui.theme.SlateGrey
import com.anchorfloat.app.ui.unstuck.UnstuckOverlay

@Composable
fun TimelineRoute(
    viewModel: TimelineViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    TimelineScreen(
        state = state,
        onIntent = viewModel::onIntent,
    )
}

@Composable
fun TimelineScreen(
    state: TimelineUiState,
    onIntent: (TimelineIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        containerColor = Paper,
        floatingActionButton = {
            if (!state.unstuckVisible) {
                ExtendedFloatingActionButton(
                    onClick = { onIntent(TimelineIntent.OpenUnstuck) },
                    containerColor = SageGreen,
                    contentColor = PaperElevated,
                    modifier = Modifier.heightIn(min = ComfortableTouchTarget),
                ) {
                    Icon(Icons.Outlined.Spa, contentDescription = null)
                    Spacer(Modifier.width(10.dp))
                    Text("Unstuck", style = MaterialTheme.typography.labelLarge)
                }
            }
        },
        floatingActionButtonPosition = FabPosition.End,
    ) { inner ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(inner),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 108.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = "Anchor & Float",
                        style = MaterialTheme.typography.headlineMedium,
                    )
                    Text(
                        text = state.todayLabel.ifBlank { "Today — a clean slate" },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            item {
                EnergyDialSelector(
                    energy = state.energy,
                    onSelect = { onIntent(TimelineIntent.SetEnergy(it)) },
                )
            }
            if (state.ramp != null) {
                item {
                    TransitionRampBanner(
                        ramp = state.ramp,
                        onDismiss = { onIntent(TimelineIntent.DismissRamp) },
                    )
                }
            }
            if (state.anchors.isEmpty() && state.pool.isEmpty() && !state.isLoading) {
                item { EmptyBoard(energy = state.energy) }
            }
            items(state.anchors, key = { it.anchor.id }) { group ->
                AnchorBlock(
                    group = group,
                    selected = state.selectedAnchorId == group.anchor.id,
                    focusedId = state.focusedTask?.id,
                    onSelectAnchor = { onIntent(TimelineIntent.SelectAnchor(group.anchor.id)) },
                    onSelectTask = { onIntent(TimelineIntent.SelectTask(it)) },
                    onComplete = { onIntent(TimelineIntent.CompleteTask(it)) },
                    onStart = { onIntent(TimelineIntent.StartTask(it)) },
                )
            }
            if (state.pool.isNotEmpty()) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "Pool",
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            text = "No clock. Pick one if it helps — or leave it.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                items(state.pool, key = { "pool-${it.id}" }) { task ->
                    FloatCard(
                        task = task,
                        focused = task.id == state.focusedTask?.id,
                        onSelect = { onIntent(TimelineIntent.SelectTask(task.id)) },
                        onComplete = { onIntent(TimelineIntent.CompleteTask(task.id)) },
                        onStart = { onIntent(TimelineIntent.StartTask(task.id)) },
                    )
                }
            }
        }
    }

    if (state.unstuckVisible && state.unstuckAction != null) {
        val target = state.unstuckTarget
        UnstuckOverlay(
            action = state.unstuckAction,
            focused = target,
            onBreakSmaller = {
                if (target != null) onIntent(TimelineIntent.BreakSmaller(target.id))
            },
            onSwap = {
                if (target != null) onIntent(TimelineIntent.SwapTask(target.id))
            },
            onDoneNext = {
                if (target != null) onIntent(TimelineIntent.CompleteTask(target.id))
            },
            onDismiss = { onIntent(TimelineIntent.DismissUnstuck) },
        )
    }
}

@Composable
private fun EmptyBoard(energy: EnergyLevel) {
    val copy = when (energy) {
        EnergyLevel.GREEN -> "Nothing on the board. That’s fine. Add something when you’re ready, or leave it quiet."
        EnergyLevel.AMBER -> "Maintenance pace. If the board is empty, you can rest here."
        EnergyLevel.RED -> "No essentials right now. That’s okay."
    }
    Text(
        text = copy,
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier
            .fillMaxWidth()
            .background(PaperElevated, RoundedCornerShape(18.dp))
            .padding(18.dp),
    )
}

@Composable
private fun AnchorBlock(
    group: AnchorTimeline,
    selected: Boolean,
    focusedId: Long?,
    onSelectAnchor: () -> Unit,
    onSelectTask: (Long) -> Unit,
    onComplete: (Long) -> Unit,
    onStart: (Long) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(PaperElevated)
            .border(
                width = if (selected) 2.dp else 1.dp,
                color = if (selected) SageGreen else OutlineQuiet,
                shape = RoundedCornerShape(22.dp),
            )
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = MinTouchTarget)
                .clickable(role = Role.Button, onClick = onSelectAnchor),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(SageGreen),
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = group.anchor.clockLabel,
                    style = MaterialTheme.typography.labelMedium,
                    color = SlateGrey,
                )
                Text(
                    text = group.anchor.title,
                    style = MaterialTheme.typography.titleLarge,
                )
            }
        }
        if (group.before.isNotEmpty()) {
            SlotLabel("Before")
            group.before.forEach { task ->
                FloatCard(
                    task = task,
                    focused = task.id == focusedId,
                    onSelect = { onSelectTask(task.id) },
                    onComplete = { onComplete(task.id) },
                    onStart = { onStart(task.id) },
                )
            }
        }
        if (group.between.isNotEmpty()) {
            SlotLabel("Between")
            group.between.forEach { task ->
                FloatCard(
                    task = task,
                    focused = task.id == focusedId,
                    onSelect = { onSelectTask(task.id) },
                    onComplete = { onComplete(task.id) },
                    onStart = { onStart(task.id) },
                )
            }
        }
        if (group.after.isNotEmpty()) {
            SlotLabel("After")
            group.after.forEach { task ->
                FloatCard(
                    task = task,
                    focused = task.id == focusedId,
                    onSelect = { onSelectTask(task.id) },
                    onComplete = { onComplete(task.id) },
                    onStart = { onStart(task.id) },
                )
            }
        }
        if (group.visibleFloats.isEmpty()) {
            Text(
                text = "No floats here. The milestone still stands.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun SlotLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

@Composable
fun FloatCard(
    task: FloatTask,
    focused: Boolean,
    onSelect: () -> Unit,
    onComplete: () -> Unit,
    onStart: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val tone = when {
        task.isEssential -> SageGreen
        task.isHighConsequence -> DustyRose
        task.isLightweight -> MutedAmber
        else -> SlateGrey
    }
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .border(
                width = if (focused) 2.dp else 0.dp,
                color = if (focused) SageGreen else OutlineQuiet,
                shape = RoundedCornerShape(16.dp),
            )
            .clickable(role = Role.Button, onClick = onSelect)
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(tone),
            )
            Spacer(Modifier.width(8.dp))
            Text(
                text = when {
                    task.isEssential -> "Essential"
                    task.isHighConsequence -> "High-stakes"
                    task.isLightweight -> "Light"
                    else -> "Float"
                },
                style = MaterialTheme.typography.labelSmall,
                color = tone,
            )
            if (task.status == TaskStatus.IN_PROGRESS) {
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "In hand",
                    style = MaterialTheme.typography.labelSmall,
                    color = SageGreen,
                )
            }
        }
        Text(text = task.title, style = MaterialTheme.typography.titleMedium)
        if (task.note.isNotBlank()) {
            Text(
                text = task.note,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
        ) {
            TextButton(
                onClick = onStart,
                modifier = Modifier.heightIn(min = MinTouchTarget),
            ) {
                Text("Hold")
            }
            TextButton(
                onClick = onComplete,
                modifier = Modifier.heightIn(min = MinTouchTarget),
            ) {
                Text("Done")
            }
        }
    }
}

@Preview(showBackground = true, backgroundColor = 0xFFF3EEE4)
@Composable
private fun TimelinePreview() {
    val sample = FloatTask(
        id = 1,
        title = "Drink a glass of water",
        note = "That’s a full step.",
        anchorId = 1,
        untilAnchorId = null,
        floatSlot = FloatSlot.BEFORE,
        sortOrder = 0,
        status = TaskStatus.PENDING,
        isEssential = true,
        isHighConsequence = false,
        isLightweight = true,
        boardDateIso = "2026-09-20",
    )
    val anchor = Anchor(
        id = 1,
        title = "Morning landing",
        wallClockMinutes = 8 * 60,
        sortOrder = 0,
        isCore = true,
        isSurvivalMilestone = true,
        sensoryHint = "Feel both feet on the floor.",
    )
    AnchorFloatTheme {
        TimelineScreen(
            state = TimelineUiState(
                energy = EnergyLevel.GREEN,
                todayLabel = "Today · Sunday 20 September",
                isLoading = false,
                anchors = listOf(
                    AnchorTimeline(anchor, before = listOf(sample), after = emptyList(), between = emptyList()),
                ),
            ),
            onIntent = {},
        )
    }
}

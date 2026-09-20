package com.anchorfloat.app.ui.timeline

import com.anchorfloat.app.domain.model.AnchorTimeline
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.ramp.TransitionRamp
import com.anchorfloat.app.domain.unstuck.UnstuckMicroAction

data class TimelineUiState(
    val energy: EnergyLevel = EnergyLevel.GREEN,
    val selectedAnchorId: Long? = null,
    val focusedTask: FloatTask? = null,
    val anchors: List<AnchorTimeline> = emptyList(),
    val pool: List<FloatTask> = emptyList(),
    val unstuckVisible: Boolean = false,
    val unstuckAction: UnstuckMicroAction? = null,
    val ramp: TransitionRamp? = null,
    val todayLabel: String = "",
    val isLoading: Boolean = true,
) {
    val visibleTaskIds: List<Long>
        get() = buildList {
            anchors.forEach { addAll(it.visibleFloats.map { task -> task.id }) }
            addAll(pool.map { it.id })
        }

    val unstuckTarget: FloatTask?
        get() = focusedTask
            ?: anchors.flatMap { it.visibleFloats }.firstOrNull()
            ?: pool.firstOrNull()
}

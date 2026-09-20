package com.anchorfloat.app.ui.timeline

import com.anchorfloat.app.domain.model.EnergyLevel

sealed interface TimelineIntent {
    data class SetEnergy(val energy: EnergyLevel) : TimelineIntent
    data class SelectAnchor(val anchorId: Long?) : TimelineIntent
    data class SelectTask(val taskId: Long) : TimelineIntent
    data class CompleteTask(val taskId: Long) : TimelineIntent
    data class StartTask(val taskId: Long) : TimelineIntent
    data class BreakSmaller(val taskId: Long) : TimelineIntent
    data class SwapTask(val taskId: Long) : TimelineIntent
    data object OpenUnstuck : TimelineIntent
    data object DismissUnstuck : TimelineIntent
    data object DismissRamp : TimelineIntent
}

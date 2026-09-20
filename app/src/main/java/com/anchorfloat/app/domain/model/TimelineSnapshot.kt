package com.anchorfloat.app.domain.model

data class UserPrefs(
    val energy: EnergyLevel,
    val lastSweepIso: String?,
    val focusedTaskId: Long?,
)

data class AnchorTimeline(
    val anchor: Anchor,
    val before: List<FloatTask>,
    val after: List<FloatTask>,
    val between: List<FloatTask>,
) {
    val visibleFloats: List<FloatTask>
        get() = before + between + after
}

data class TimelineSnapshot(
    val energy: EnergyLevel,
    val anchors: List<AnchorTimeline>,
    val pool: List<FloatTask>,
    val focusedTask: FloatTask?,
)

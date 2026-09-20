package com.anchorfloat.app.domain.model

/**
 * A fixed external milestone with a wall-clock time (e.g. "09:00 Work Shift").
 * Anchors are the skeleton of the day — not a minute-by-minute schedule.
 */
data class Anchor(
    val id: Long,
    val title: String,
    val wallClockMinutes: Int,
    val sortOrder: Int,
    val isCore: Boolean,
    val isSurvivalMilestone: Boolean,
    val sensoryHint: String,
) {
    val clockLabel: String
        get() {
            val hours = (wallClockMinutes / 60).mod(24)
            val minutes = wallClockMinutes.mod(60)
            return "%02d:%02d".format(hours, minutes)
        }
}

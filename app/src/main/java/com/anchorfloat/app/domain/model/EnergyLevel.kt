package com.anchorfloat.app.domain.model

/**
 * Three discrete energy states. Changing energy refilters the timeline in real time.
 *
 * There is no "wrong" setting. Red is not a failure state.
 */
enum class EnergyLevel {
    /** Flow — show all scheduled floats and the queued pool. */
    GREEN,

    /** Maintenance — core anchors and lightweight floats only. Non-essential backlog is hidden. */
    AMBER,

    /** Survival — hydration, food, meds, and high-consequence deadlines only. */
    RED,
    ;

    val shortLabel: String
        get() = when (this) {
            GREEN -> "Flow"
            AMBER -> "Maintenance"
            RED -> "Survival"
        }

    val description: String
        get() = when (this) {
            GREEN -> "Scheduled floats and the pool are all here."
            AMBER -> "Core anchors and lighter floats. The rest can wait."
            RED -> "Essentials only. That is plenty."
        }
}

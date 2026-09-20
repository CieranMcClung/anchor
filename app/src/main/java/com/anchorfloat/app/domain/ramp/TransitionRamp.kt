package com.anchorfloat.app.domain.ramp

import com.anchorfloat.app.domain.model.Anchor
import java.time.LocalTime

/**
 * A soft 10–15 minute pre-anchor buffer. No countdown, no urgency chrome.
 */
data class TransitionRamp(
    val anchor: Anchor,
    val suggestion: String,
)

object TransitionRampResolver {

    const val WINDOW_MINUTES: Int = 15

    fun resolve(anchors: List<Anchor>, now: LocalTime): TransitionRamp? {
        val nowMinutes = now.hour * 60 + now.minute
        val upcoming = anchors
            .map { anchor -> anchor to minutesUntil(anchor.wallClockMinutes, nowMinutes) }
            .filter { (_, delta) -> delta in 1..WINDOW_MINUTES }
            .minByOrNull { it.second }
            ?: return null
        val (anchor, _) = upcoming
        return TransitionRamp(
            anchor = anchor,
            suggestion = suggestionFor(anchor),
        )
    }

    private fun minutesUntil(anchorMinutes: Int, nowMinutes: Int): Int {
        val delta = anchorMinutes - nowMinutes
        return if (delta >= 0) delta else delta + 24 * 60
    }

    private fun suggestionFor(anchor: Anchor): String {
        val hint = anchor.sensoryHint.ifBlank {
            "A stretch, a sip of water, or sitting still for a breath."
        }
        return "${anchor.title} is nearby. $hint"
    }
}

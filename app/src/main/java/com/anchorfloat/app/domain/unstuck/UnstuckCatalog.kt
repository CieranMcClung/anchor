package com.anchorfloat.app.domain.unstuck

import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatTask

/**
 * A single micro-action for the current energy tier. The overlay never offers a menu of chores.
 */
data class UnstuckMicroAction(
    val title: String,
    val body: String,
    val energy: EnergyLevel,
)

object UnstuckCatalog {

    fun forEnergy(energy: EnergyLevel, focused: FloatTask?): UnstuckMicroAction {
        val name = focused?.title?.trim().orEmpty()
        return when (energy) {
            EnergyLevel.GREEN -> UnstuckMicroAction(
                title = "One quiet start",
                body = if (name.isNotEmpty()) {
                    "Open “$name” and stay with it for two minutes. Stopping is allowed."
                } else {
                    "Pick the nearest float and just open it. Two minutes is a full start."
                },
                energy = energy,
            )
            EnergyLevel.AMBER -> UnstuckMicroAction(
                title = "The lightest next step",
                body = if (name.isNotEmpty()) {
                    "You don’t have to finish “$name”. Touch it once, or swap to something lighter."
                } else {
                    "Touch the next light float, or swap. Either is a complete move."
                },
                energy = energy,
            )
            EnergyLevel.RED -> UnstuckMicroAction(
                title = "Just this",
                body = if (focused?.isEssential == true) {
                    "Do “$name” if you can. If not: sip water. That is the whole list."
                } else {
                    "Sip water, or eat a little something. Nothing else is required."
                },
                energy = energy,
            )
        }
    }

    fun smallerTitle(task: FloatTask): String {
        val trimmed = task.title.trim()
        return when {
            task.isEssential -> "Just the first sip or bite — “$trimmed”"
            trimmed.length <= 22 -> "Open “$trimmed” — one minute only"
            else -> "Just open it: ${trimmed.take(28).trim()}…"
        }
    }
}

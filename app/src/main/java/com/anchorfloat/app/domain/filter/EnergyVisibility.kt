package com.anchorfloat.app.domain.filter

import com.anchorfloat.app.domain.model.Anchor
import com.anchorfloat.app.domain.model.EnergyLevel
import com.anchorfloat.app.domain.model.FloatTask

/**
 * Energy visibility rules. Room DAOs encode the same logic in SQL so the
 * timeline can refilter from the database; this object is the domain source of truth.
 *
 * GREEN — all scheduled + queued (open) tasks.
 * AMBER — core-board lightweight/essential/high-consequence floats; hide non-essential pool.
 * RED — essential survival work and high-consequence deadlines only.
 */
object EnergyVisibility {

    fun isTaskVisible(task: FloatTask, energy: EnergyLevel): Boolean {
        if (!task.isOpen) return false
        return when (energy) {
            EnergyLevel.GREEN -> true
            EnergyLevel.AMBER -> {
                val onBoard = task.isOnBoard
                val lightOrNeeded = task.isLightweight || task.isEssential || task.isHighConsequence
                val essentialPool = task.isInPool && task.isEssential
                (onBoard && lightOrNeeded) || essentialPool
            }
            EnergyLevel.RED -> task.isEssential || task.isHighConsequence
        }
    }

    fun isAnchorVisible(
        anchor: Anchor,
        visibleChildren: List<FloatTask>,
        energy: EnergyLevel,
    ): Boolean = when (energy) {
        EnergyLevel.GREEN -> true
        EnergyLevel.AMBER -> anchor.isCore || visibleChildren.isNotEmpty()
        EnergyLevel.RED -> visibleChildren.isNotEmpty() || anchor.isSurvivalMilestone
    }

    fun filterTasks(tasks: Iterable<FloatTask>, energy: EnergyLevel): List<FloatTask> =
        tasks.filter { isTaskVisible(it, energy) }
}

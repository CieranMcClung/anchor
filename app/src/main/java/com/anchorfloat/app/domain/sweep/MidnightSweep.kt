package com.anchorfloat.app.domain.sweep

import com.anchorfloat.app.domain.model.FloatSlot
import com.anchorfloat.app.domain.model.FloatTask
import com.anchorfloat.app.domain.model.TaskStatus

/**
 * Midnight sweep, as a pure function so tests (and Room) share one rule.
 *
 * Unchecked floats leave today's board and return to the unassigned pool.
 * Done items leave the board quietly. No overdue flags, no streaks, no scores.
 */
object MidnightSweep {

    fun apply(tasks: List<FloatTask>, todayIso: String): List<FloatTask> {
        return tasks.map { task ->
            val board = task.boardDateIso
            if (board == null || board >= todayIso) {
                task
            } else {
                when (task.status) {
                    TaskStatus.PENDING, TaskStatus.IN_PROGRESS -> task.copy(
                        anchorId = null,
                        untilAnchorId = null,
                        floatSlot = FloatSlot.POOL,
                        boardDateIso = null,
                        status = TaskStatus.SWEPT_TO_BACKLOG,
                    )
                    TaskStatus.DONE -> task.copy(
                        boardDateIso = null,
                    )
                    TaskStatus.SWEPT_TO_BACKLOG -> task.copy(
                        anchorId = null,
                        untilAnchorId = null,
                        floatSlot = FloatSlot.POOL,
                        boardDateIso = null,
                    )
                }
            }
        }
    }
}
